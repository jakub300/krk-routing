/* eslint-disable no-underscore-dangle */

import { serializable, identifier, primitive } from 'serializr';
import { gtfsPrefix, gtfsString, gtfsNumber } from './decorators';
import id from './id';
import { Trip } from '.';

@gtfsPrefix('route_')
export default class Route {
  @serializable(identifier())
  id = id();

  @gtfsString('route_id')
  _id = '';

  @gtfsString()
  @serializable(primitive())
  shortName = '';

  @gtfsString()
  @serializable(primitive())
  longName?: string;

  // @gtfsNumber()
  // @serializable(primitive())
  // type = -1;

  trips = new Set<Trip>();

  private _variants?: Set<Set<Trip>>;

  addTrip(trip: Trip) {
    this.trips.add(trip);
  }

  get variants() {
    if (!this._variants) {
      const variants: { [key: string]: Set<Trip> } = {};

      this.trips.forEach(trip => {
        const variantId = trip.stopTimes.map(st => st.stop && st.stop.id).join('-');
        if (!variants[variantId]) {
          variants[variantId] = new Set<Trip>();
        }

        variants[variantId].add(trip);
      });
      this._variants = new Set(Object.values(variants));
    }

    return this._variants;
  }
}
