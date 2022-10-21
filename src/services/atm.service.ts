import { LatLngLiteral } from '@googlemaps/google-maps-services-js';
import IATMService from '@services/interfaces/atm.service.interface';
import { Service } from 'typedi';
import BigQueryService from './bigquery.service';

@Service()
export default class ATMService implements IATMService {
  constructor(private bigqueryService: BigQueryService) {}

  async getClosestATMs(userLocation: LatLngLiteral, limit: number) {
    return this.bigqueryService.getClosestATMs(userLocation, limit);
  }

  async getClosestATM(userLocation: LatLngLiteral) {
    return this.bigqueryService.getClosestATM(userLocation);
  }
}
