import { createSimpleSchema, deserialize, list, object } from 'serializr';
import { Data } from '../assets/data/gtfs';
import { Agency, Route, Stop, StopTime, Trip } from '.';

// eslint-disable-next-line import/prefer-default-export
export type BaseData = {
  agencies: Agency[];
  stops: Stop[];
  routes: Route[];
  trips: Trip[];
  stopTimes: StopTime[];
};

const dataPath = require('../assets/data/gtfs-data.pb');

const dataSchema = createSimpleSchema({
  agencies: list(object(Agency)),
  stops: list(object(Stop)),
  routes: list(object(Route)),
  trips: list(object(Trip)),
  stopTimes: list(object(StopTime)),
});

const win = <any>window;

async function getAndParseProtoBuff() {
  const dataPB = await fetch(dataPath).then(res => res.arrayBuffer());
  const dataMessage = Data.decode(new Uint8Array(dataPB));
  return dataMessage.toJSON();
}

async function get() {
  // console.profile('parse-deserialize');
  const dataMessageJson = await getAndParseProtoBuff();
  const data = deserialize(dataSchema, dataMessageJson) as BaseData;

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
