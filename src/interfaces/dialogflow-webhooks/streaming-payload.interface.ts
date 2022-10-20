import { LatLngLiteral } from '@googlemaps/google-maps-services-js';

export interface LocationPayload {
  location: LatLngLiteral;
  locationAllowed: boolean;
}

export interface ResponseMessagePayload {
  mapImageSrc?: string;
}
