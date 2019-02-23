import { identifier, serializable, primitive } from 'serializr';
import { gtfsString, gtfsPrefix, gtfsDecodeOnly } from './decorators';
import id from './id';

@gtfsPrefix('agency_')
export default class Agency {
  @gtfsDecodeOnly()
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
