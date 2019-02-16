import { identifier, serializable, primitive } from 'serializr';
import { gtfsString, gtfsPrefix } from './decorators';
import id from './id';

@gtfsPrefix('agency_')
export default class Agency {
  @serializable(identifier())
  id = id();

  @gtfsString('agency_id')
  _id = '';

  @gtfsString()
  @serializable(primitive())
  name = '';

  test() {
    console.log(this);
  }
}
