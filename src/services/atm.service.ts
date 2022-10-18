import { LatLngLiteral } from '@googlemaps/google-maps-services-js';
import IATMService from '@services/interfaces/atm.service.interface';

export default class ATMService implements IATMService {
  getClosestATMs(location: LatLngLiteral) {
    // TODO: get data from BigQuery
    return [];
  }

  getClosestATM(location: LatLngLiteral) {
    return this.getClosestATMs(location)[0];
  }
}
