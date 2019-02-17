/* eslint-disable no-underscore-dangle */

import { serializable, reference, serialize, identifier, primitive } from 'serializr';
import { gtfsPrefix, gtfsReference, gtfsString, gtfsNumber } from './decorators';
import id from './id';
import { Route, StopTime, Stop } from '.';

@gtfsPrefix('trip_')
export default class Trip {
  @serializable(identifier())
  id = id();

  @gtfsReference(Route, 'route_id')
  @serializable(reference(Route))
  route?: Route;

  @gtfsString('trip_id')
  _id = '';

  @gtfsString()
  @serializable(primitive())
  headsign = '';

  @gtfsNumber('direction_id')
  @serializable(primitive())
  directionId = -1;

  @gtfsString('block_id')
  @serializable(primitive())
  blockId = '';

  stopTimes: StopTime[] = [];

  private _stops?: Stop[];

  addStopTime(stopTime: StopTime) {
    this.stopTimes.push(stopTime);
  }

  initialize() {
    this.stopTimes.sort((a, b) => a.stopSequence - b.stopSequence);

    if (this.route) {
      this.route.addTrip(this);
    }
  }

  get stops() {
    if (!this._stops) {
      // TODO: check if exists
      this._stops = this.stopTimes.map(st => st.stop) as Stop[];
    }

    return this._stops;
  }
}
