/* eslint-disable import/no-extraneous-dependencies, no-underscore-dangle, no-param-reassign */

import parse from 'csv-parse';
import fs from 'fs';
import path from 'path';
import { serialize, createSimpleSchema, list, object } from 'serializr';
import protobuf from 'protobufjs';
import { gzipSync } from 'zlib';
import { compress } from 'wasm-brotli';
import { performance } from 'perf_hooks';
import { importObject } from '../decorators';
import { Agency, Route, Stop, StopTime, Trip } from '..';

const BASE = path.join(__dirname, '../../../data');
const TARGET = path.join(__dirname, '../../assets/data/gtfs-data.pb');

function parseFile<T>(file: string, clazz: any, resolvers: any = null): Promise<Array<T>> {
  return new Promise((resolve, reject) => {
    const objects: Array<T> = [];

    fs.createReadStream(path.join(BASE, file))
      .pipe(parse({ columns: true }))
      .on('data', data => {
        const obj = importObject<T>(clazz, data, resolvers);
        objects.push(obj);
      })
      .on('end', () => {
        resolve(objects);
      });
    // const fileBody = fs.readFileSync(path.join(BASE, file));
    // const parsed = parse(fileBody.toString('utf8'), { columns: true });
    // objects = parsed.map((data: T) => importObject<T>(clazz, data, resolvers));
    // resolve(objects);
  });
}

// const data = {};
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

const resolvers = new Map<Object, Function>([
  [Stop, (id: any) => dataById.stops[id]],
  [Route, (id: any) => dataById.routes[id]],
  [Trip, (id: any) => dataById.trips[id]],
]);

function indexData(type: 'routes' | 'trips' | 'stops', arr: any[]) {
  const data = dataById[type];

  arr.forEach(el => {
    data[el._id] = el;
  });
}

(async () => {
  const agencies = await parseFile('bus/agency.txt', Agency);
  const stops = await parseFile('bus/stops.txt', Stop);
  indexData('stops', stops);
  const routes = await parseFile('bus/routes.txt', Route);
  indexData('routes', routes);
  const trips = await parseFile('bus/trips.txt', Trip, resolvers);
  indexData('trips', trips);
  // performance.mark('stopTimesStart');
  const stopTimes = await parseFile<StopTime>('bus/stop_times.txt', StopTime, resolvers);
  // performance.mark('stopTimesEnd');
  // performance.measure('stopTimes', 'stopTimesStart', 'stopTimesEnd');
  // console.log(performance.getEntriesByType('measure'));

  stopTimes.forEach(st => {
    if (st.arrivalTime !== st.departureTime) {
      delete st.departureTime;
    }

    if (st.stopHeadsign === '' || st.stopHeadsign === (st.trip && st.trip.headsign)) {
      delete st.stopHeadsign;
    }
  });

  // console.log(
  //   agencies,
  //   stops.slice(0, 100),
  //   routes.slice(0, 100),
  //   trips.slice(0, 100),
  //   stopTimes.slice(0, 100),
  // );
  // debugger;
  const dataSchema = createSimpleSchema({
    agencies: list(object(Agency)),
    stops: list(object(Stop)),
    routes: list(object(Route)),
    trips: list(object(Trip)),
    stopTimes: list(object(StopTime)),
  });

  const data = { agencies, stops, routes, trips, stopTimes };

  // const data = { stopTimes };
  const serializedData = serialize(dataSchema, data);
  // const stringifiedData = JSON.stringify(serializedData);
  // const zipped = gzipSync(stringifiedData);
  // const compressed = await compress(Buffer.from(stringifiedData, 'utf8'));
  // console.log(stringifiedData.length, zipped.length, compressed.length);

  const protoRoot = await protobuf.load(path.join(__dirname, '../gtfs.proto'));
  const Data = protoRoot.lookupType('Data');
  const verError = Data.verify(serializedData);
  if (verError) {
    throw new Error(verError);
  }
  const dataMessage = Data.create(serializedData);
  const stopTimeBuffer = Buffer.from(Data.encode(dataMessage).finish());
  fs.writeFileSync(TARGET, stopTimeBuffer);

  // console.log(stopTimeBuffer.length);
  // const dataDecoded = Data.decode(stopTimeBuffer);
  // const dataDecodedObject = Data.toObject(dataDecoded);
  // // console.log(dataDecodedObject);
  // // debugger;

  // // // const stopTimeBuffer = Buffer.concat(stopTimesBuffers);
  // const zipped2 = gzipSync(stopTimeBuffer);
  // const compressed2 = await compress(stopTimeBuffer);
  // console.log(stopTimeBuffer.length, zipped2.length, compressed2.length);
  // fs.writeFileSync('./stops2', stopTimeBuffer);

  debugger;
})();
