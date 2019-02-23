import { Map as LeafletMap, Marker, CircleMarker, Polyline, LeafletMouseEvent } from 'leaflet';
import Vue from 'vue';
import { debounce } from 'throttle-debounce';
// eslint-disable-next-line import/named
import { BaseData } from '../gtfs/decoder';
import RoutesList from '../components/RoutesList.vue';
import { Route, Stop } from '@/gtfs';
import { startTrace, stopTrace, printTraces, resetTracing } from './tracing';

const colors = ['red', 'blue', 'green', 'orange', 'gray', 'purple'];

const LAT_KM = 111.22980674097782;
const LON_KM = 71.63824834077195;

type LatLon = { lat: number; lon: number };

export const mapManagerEvents = new Vue();

const sqr = (v: number) => v * v;
const WALKING_SPEED = 3 / 3600;

function createWalkingMatrix(stops: Stop[]) {
  return stops.map(stop1 =>
    stops.map(
      stop2 =>
        Math.sqrt(sqr((stop1.lon - stop2.lon) * LON_KM) + sqr((stop1.lat - stop2.lat) * LAT_KM)) /
        WALKING_SPEED,
    ),
  );
}

export default class MapManager {
  data: BaseData;

  map: LeafletMap;

  activeLines: Polyline[] = [];

  routeLine: Polyline = new Polyline([], { color: 'red' });

  walkingMatrix: number[][] = [];

  constructor(map: LeafletMap, data: BaseData) {
    this.map = map;
    this.data = data;
    this.walkingMatrix = createWalkingMatrix(data.stops);

    this.addStops();
    console.log(this.data);

    let start: LatLon | null = null;
    let end: LatLon | null = null;

    const startMarker = new Marker([0, 0], {
      draggable: true,
      autoPan: true,
      title: 'Start',
    } as any);
    const endMarker = new Marker([0, 0], {
      draggable: true,
      autoPan: true,
      title: 'End',
    } as any);

    const routing = debounce(200, () => {
      if (start && end) {
        this.routing({ start, end });
      }
    });

    startMarker.on('move', ev => {
      const { lat, lng } = (ev as LeafletMouseEvent).latlng;
      start = { lat, lon: lng };
      routing();
    });

    endMarker.on('move', ev => {
      const { lat, lng } = (ev as LeafletMouseEvent).latlng;
      end = { lat, lon: lng };
      routing();
    });

    map.on('click', ev => {
      console.log((ev as LeafletMouseEvent).latlng);
      const { lat, lng } = (ev as LeafletMouseEvent).latlng;

      if (!start) {
        start = { lat, lon: lng };
        startMarker.setLatLng({ lat, lng }).addTo(map);
        return;
      }

      if (!end) {
        end = { lat, lon: lng };
        endMarker.setLatLng({ lat, lng }).addTo(map);
        this.routeLine.addTo(map);
      }
    });
  }

  addStops() {
    const { map } = this;
    this.data.stops.forEach(stop => {
      const marker = new CircleMarker([stop.lat, stop.lon]);
      marker.bindTooltip(`${stop.name} (${stop.id})`).openTooltip();
      marker
        .bindPopup(() => {
          const div = document.createElement('div');
          const callback = (route: Route) => {
            this.showRoute(route);
          };

          // TODO: this is leaking memory, should be destroyed
          // eslint-disable-next-line no-new
          const instance = new Vue({
            render(h) {
              return h(RoutesList, { attrs: { routes: stop.routes, callback } });
            },
          });

          Vue.nextTick(() => {
            instance.$mount(div);
          });

          return div;
        })
        .openPopup();

      marker.addTo(map);
    });
  }

  showRoute(route: Route) {
    const { map } = this;

    this.activeLines.forEach(line => line.remove());

    Array.from(route.variants)
      .map(v => v.values().next().value)
      .filter(trip => trip.stopTimes.length > 0)
      .forEach((trip, tripIndex) => {
        const latlngs = trip.stopTimes
          .map(({ stop }) => (stop ? [stop.lat, stop.lon] : null))
          .filter(val => val);
        const polyline = new Polyline(latlngs as any, {
          opacity: 0.5,
          color: colors[tripIndex % colors.length],
        });
        this.activeLines.push(polyline);

        polyline.addTo(map);
      });
  }

  routing({ start, end }: { start: LatLon; end: LatLon }) {
    resetTracing();
    const scope1 = startTrace('routing');
    const perfStart = performance.now();
    // console.profile('routing');
    const { data } = this;
    // const start = { lat: 50.04368629910762, lon: 19.930604213045072 };
    // const end = { lat: 50.03452506209951, lon: 20.0037809269445 };
    const startTime = 10 * 60 * 60;
    const endTime = 24 * 60 * 60;
    const transfer = 5 * 60;

    type StopDataHistoryEntry = {
      text: string;
      duration: number;
      points?: LatLon[];
      start?: number;
      end?: number;
    };

    type StopData = {
      startDistance: number;
      endDistance: number;
      endDuration: number;
      arr: {
        time: number;
        history: StopDataHistoryEntry[];
        perfDiff?: number;
      };
      checked: boolean;
    };

    const stopsData: { [key: string]: StopData } = {};

    let scope2 = startTrace('stops#forEach');
    data.stops.forEach(stop => {
      const startDistance = Math.sqrt(
        sqr((start.lon - stop.lon) * LON_KM) + sqr((start.lat - stop.lat) * LAT_KM),
      );
      const endDistance = Math.sqrt(
        sqr((end.lon - stop.lon) * LON_KM) + sqr((end.lat - stop.lat) * LAT_KM),
      );
      const endDuration = endDistance / WALKING_SPEED;
      const duration = startDistance / WALKING_SPEED;
      const time = startTime + duration + transfer;

      const stopData: StopData = {
        startDistance,
        endDistance,
        endDuration,
        arr: {
          time,
          history: [
            {
              text: `walk to ${stop.name}`,
              duration,
              points: [start, stop],
              start: startTime,
              end: startTime + duration,
            },
          ],
        },
        checked: false,
      };

      stopsData[stop.id] = stopData;
    });
    stopTrace(scope2);

    scope2 = startTrace('checkStopLoop');
    while (true) {
      let checkStop: Stop | null = null;
      let checkStopIndex = -1;
      let minTime = 1e10;

      let scope3 = startTrace('stops#forEach', true);
      data.stops.forEach((stop, stopIndex) => {
        const stopData = stopsData[stop.id];
        if (stopData.checked) {
          return;
        }

        if (minTime > stopData.arr.time) {
          minTime = stopData.arr.time;
          checkStop = stop;
          checkStopIndex = stopIndex;
        }
      });
      stopTrace(scope3);

      if (!checkStop) {
        break;
      }

      checkStop = checkStop as Stop;

      const checkStopData = stopsData[checkStop.id];

      scope3 = startTrace('walkingMatrix', true);
      this.walkingMatrix[checkStopIndex].forEach((time, stopIndex) => {
        if (time === 0) {
          return;
        }

        const stop = data.stops[stopIndex];
        const arrTime = checkStopData.arr.time + time;
        const stopData = stopsData[stop.id];
        if (arrTime < stopData.arr.time) {
          stopData.arr.time = arrTime;
          stopData.arr.history = checkStopData.arr.history.slice(0);
          stopData.arr.history.push({
            text: `walk to ${stop.name}`,
            duration: time,
          });
        }
      });
      stopTrace(scope3);
      scope3 = startTrace('trips#forEach', true);
      checkStop.tripsWithStopIndexes.forEach(([trip, index]) => {
        // TODO: dates skipped
        const depTime = trip.stopTimes[index].departureTime;
        if (depTime > endTime || depTime < minTime) {
          return;
        }

        const scope4 = startTrace('stopsFor', true);
        for (let i = index + 1; i < trip.stops.length; i += 1) {
          const stop = trip.stops[i];
          const stopData = stopsData[stop.id];
          const arrTime = trip.stopTimes[i].arrivalTime + transfer;
          if (arrTime < stopData.arr.time) {
            stopData.arr.time = arrTime;
            stopData.arr.history = checkStopData.arr.history.slice(0);
            stopData.arr.history.push({
              text: 'wait',
              duration: trip.stopTimes[index].departureTime - checkStopData.arr.time + transfer,
            });
            const points = [];
            for (let j = index; j <= i; j += 1) {
              points.push(trip.stops[j]);
            }
            stopData.arr.history.push({
              text: `line ${trip.route && trip.route.shortName} to ${stop.name}`,
              duration: trip.stopTimes[i].arrivalTime - trip.stopTimes[index].departureTime,
              points,
              start: trip.stopTimes[index].departureTime,
              end: trip.stopTimes[i].arrivalTime,
            });
          }
        }
        stopTrace(scope4);
      });
      stopTrace(scope3);
      checkStopData.checked = true;
    }
    stopTrace(scope2);

    let bestTime = 1e10;
    let bestStop: Stop | null = null;

    scope2 = startTrace('bestStopLoop');
    data.stops.forEach(stop => {
      const stopData = stopsData[stop.id];
      stopData.arr.time += stopData.endDuration;
      stopData.arr.history.push({
        text: 'walk to destination',
        duration: stopData.endDuration,
        points: [stop, end],
        end: stopData.arr.time,
      });
      if (bestTime > stopData.arr.time) {
        bestTime = stopData.arr.time;
        bestStop = stop;
      }
    });
    stopTrace(scope2);

    // console.profileEnd();
    stopTrace(scope1);
    printTraces();

    if (!bestStop) {
      return;
    }

    bestStop = bestStop as Stop;

    console.log(bestStop);
    console.log(stopsData[bestStop.id]);

    const bestStopData = stopsData[bestStop.id];

    type StepPoint = Stop | LatLon;

    const points = (bestStopData.arr.history as Array<any>)
      .map((step: any) => step.points as StepPoint[])
      .flat(1)
      .filter(obj => obj)
      .map(sp => ({ lat: sp.lat, lng: sp.lon }));

    const perfDiff = performance.now() - perfStart;
    bestStopData.arr.perfDiff = perfDiff;

    this.routeLine.setLatLngs(points);
    mapManagerEvents.$emit('route', bestStopData.arr);
  }
}
