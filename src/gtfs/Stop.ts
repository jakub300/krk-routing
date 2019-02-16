import { identifier, primitive, serializable } from 'serializr';
import { gtfsNumber, gtfsString, gtfsPrefix } from './decorators';
import id from './id';

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
}
