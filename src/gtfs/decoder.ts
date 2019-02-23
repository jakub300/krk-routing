/* eslint-disable no-underscore-dangle */

import { Data } from '../assets/data/gtfs';
import { Agency, Route, Stop, StopTime, Trip } from '.';
import { deserializeObject, indexFieldsForClasses } from './decorators';

// eslint-disable-next-line import/prefer-default-export
export type BaseData = {
  agencies: Agency[];
  stops: Stop[];
  routes: Route[];
  trips: Trip[];
  stopTimes: StopTime[];
};

const dataPath = require('../assets/data/gtfs-data.pb');

const win = <any>window;

async function getAndParseProtoBuff() {
  const dataPB = await fetch(dataPath).then(res => res.arrayBuffer());
  const dataMessage = Data.decode(new Uint8Array(dataPB));
  return dataMessage;
}

type indexedData = {
  stops: { [key: string]: any };
  routes: { [key: string]: any };
  trips: { [key: string]: any };
};

const dataById: indexedData = {
  stops: {},
  routes: {},
  trips: {},
};

const resolvers = {
  [Stop.name]: (id: any) => dataById.stops[id],
  [Route.name]: (id: any) => dataById.routes[id],
  [Trip.name]: (id: any) => dataById.trips[id],
};

function indexData(type: 'routes' | 'trips' | 'stops', arr: any[]) {
  const data = dataById[type];

  arr.forEach(el => {
    data[el.id] = el;
  });
}

function deserializeCustom(json: any) {
  const agencies = json.agencies.map((obj: any) => deserializeObject<Agency>(Agency, obj));
  const stops = json.stops.map((obj: any) => deserializeObject<Stop>(Stop, obj));
  indexData('stops', stops);
  const routes = json.routes.map((obj: any) => deserializeObject<Route>(Route, obj, resolvers));
  indexData('routes', routes);
  const trips = json.trips.map((obj: any) => deserializeObject<Trip>(Trip, obj, resolvers));
  indexData('trips', trips);
  const stopTimes = json.stopTimes.map((obj: any) =>
    deserializeObject<StopTime>(StopTime, obj, resolvers),
  );
  //
  return {
    agencies,
    stops,
    routes,
    trips,
    stopTimes,
  };
}

async function get() {
  // console.profile('parse-deserialize');
  indexFieldsForClasses([Agency, Stop, Route, Trip, StopTime]);
  const dataMessageJson = await getAndParseProtoBuff();
  const data = deserializeCustom(dataMessageJson) as BaseData;

  // console.profileEnd();

  data.stopTimes.forEach(stopTime => {
    stopTime.initialize();
  });

  data.trips.forEach(trip => {
    trip.initialize();
  });

  // console.log(deserialized);
  // console.log('done');
  return data;
}

win.getData = get();
