import { LatLngLiteral } from '@googlemaps/google-maps-services-js';
import type { ATM } from '@interfaces/atm.interface';

export default abstract class IATMService {
  abstract getClosestATMs: (userLocation: LatLngLiteral, ...extraArgs: any[]) => ATM[] | Promise<ATM[]>;
  abstract getClosestATM: (userLocation: LatLngLiteral, ...extraArgs: any[]) => ATM | Promise<ATM>;
}
