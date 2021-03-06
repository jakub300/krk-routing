import { serializable, primitive, reference } from 'serializr';
import { gtfsString, gtfsReference, gtfsNumber, gtfsTime } from './decorators';
import { Trip, Stop } from '.';

export default class StopTime {
  @gtfsReference(Trip, 'trip_id')
  @serializable(reference(Trip))
  trip?: Trip;

  @gtfsTime()
  @serializable(primitive())
  arrivalTime = 0;

  @gtfsTime()
  @serializable(primitive())
  departureTime = 0;

  @gtfsReference(Stop, 'stop_id')
  @serializable(reference(Stop))
  stop?: Stop;

  @gtfsNumber()
  @serializable(primitive())
  stopSequence = -1;

  @gtfsString()
  @serializable(primitive())
  stopHeadsign = '';

  @gtfsNumber()
  @serializable(primitive())
  pickupType = -1;

  @gtfsNumber()
  @serializable(primitive())
  dropOffType = -1;

  initialize() {
    if (!this.departureTime) {
      this.departureTime = this.arrivalTime;
    }

    if (this.trip) {
      this.trip.addStopTime(this);
    }

    if (this.stop && this.trip) {
      this.stop.addTrip(this.trip);
    }
  }
}
