import { identifier, primitive, serializable } from 'serializr';
import { gtfsNumber, gtfsString, gtfsPrefix } from './decorators';
import id from './id';
import { Trip, Route } from '.';

@gtfsPrefix('stop_')
export default class Stop {
  @serializable(identifier())
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

  addTrip(trip: Trip) {
    this.trips.add(trip);

    if (trip.route) {
      this.routes.add(trip.route);
    }
  }
}
