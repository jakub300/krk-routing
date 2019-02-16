import { Map as LeafletMap, Marker, CircleMarker, Polyline } from 'leaflet';
import Vue from 'vue';
// eslint-disable-next-line import/named
import { BaseData } from '../gtfs/decoder';
import RoutesList from '../components/RoutesList.vue';
import { Route } from '@/gtfs';

const colors = ['red', 'blue', 'green', 'orange', 'gray', 'purple'];

export default class MapManager {
  data: BaseData;

  map: LeafletMap;

  activeLines: Polyline[] = [];

  constructor(map: LeafletMap, data: BaseData) {
    this.map = map;
    this.data = data;

    this.addStops();
    console.log(this.data);
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
}
