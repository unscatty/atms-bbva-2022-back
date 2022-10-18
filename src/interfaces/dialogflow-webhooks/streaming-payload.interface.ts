import { LatLngLiteral } from '@googlemaps/google-maps-services-js';

export default interface LocationPayload {
  location: LatLngLiteral;
  locationAllowed: boolean;
}
