import { LatLngLiteral } from '@googlemaps/google-maps-services-js';
import type { ATM } from '@interfaces/atm.interface';

export default abstract class IATMService {
  abstract getClosestATMs: (location: LatLngLiteral) => ATM[] | Promise<ATM[]>;
  abstract getClosestATM: (location: LatLngLiteral) => ATM | Promise<ATM>;
}
