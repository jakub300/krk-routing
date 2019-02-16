import { serializable, identifier, primitive } from 'serializr';
import { gtfsPrefix, gtfsString, gtfsNumber } from './decorators';
import id from './id';

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
}
