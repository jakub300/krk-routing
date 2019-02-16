import { serializable, reference, serialize, identifier, primitive } from 'serializr';
import { gtfsPrefix, gtfsReference, gtfsString, gtfsNumber } from './decorators';
import Route from './Route';
import id from './id';

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
}
