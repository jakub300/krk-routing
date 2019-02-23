import { identifier, primitive, serializable } from 'serializr';
import { gtfsNumber, gtfsString, gtfsPrefix, gtfsDecodeOnly } from './decorators';
import id from './id';
import { Trip, Route } from '.';

@gtfsPrefix('stop_')
export default class Stop {
  @serializable(identifier())
  @gtfsDecodeOnly()
  id = id();

  @gtfsString('stop_id')
  _id = '';

  @gtfsString()
  @serializable(primitive())
  name = '';

  @gtfsNumber()
  @serializable(primitive())
  lat = 0;

  @gtfsNumber()
  @serializable(primitive())
  lon = 0;

  trips = new Set<Trip>();

  routes = new Set<Route>();

  private tripsWithStopIndexesData?: [Trip, number][];

  addTrip(trip: Trip) {
    this.trips.add(trip);

    if (trip.route) {
      this.routes.add(trip.route);
    }
  }

  get tripsWithStopIndexes() {
    if (!this.tripsWithStopIndexesData) {
      this.tripsWithStopIndexesData = Array.from(this.trips).map(
        (trip): [Trip, number] => [trip, trip.stops.indexOf(this)],
      );
    }

    return this.tripsWithStopIndexesData;
  }
}
