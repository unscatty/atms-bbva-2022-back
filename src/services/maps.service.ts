import { Client as MapsClient, Language, LatLngLiteral, UnitSystem } from '@googlemaps/google-maps-services-js';
import { asyncStaticMapUrl } from 'static-google-map';
import { Inject, Service } from 'typedi';
import { GOOGLE_MAPS_API_KEY_TOKEN } from '@config';
import { mapStylesParam } from '@config';
@Service()
export default class MapsService {
  API_KEY: string;
  mapsClient: MapsClient;

  constructor(@Inject(GOOGLE_MAPS_API_KEY_TOKEN) apiKey: string) {
    this.API_KEY = apiKey;
    this.mapsClient = new MapsClient();
  }

  async getDirections(from: LatLngLiteral, to: LatLngLiteral) {
    const response = await this.mapsClient.directions({
      params: {
        key: this.API_KEY,
        origin: from,
        destination: to,
        language: Language.es,
        units: UnitSystem.metric,
      },
    });

    return response.data;
  }

  async getDirectionsImage(from: LatLngLiteral, to: LatLngLiteral) {
    const data = await this.getDirections(from, to);

    const result = await asyncStaticMapUrl({
      key: this.API_KEY,
      size: '600x600',
      // style: styleEncoded,
      markers: [
        {
          location: from,
        },
        {
          location: to,
        },
      ],
      paths: data.routes.map(route => route.overview_polyline),
    });

    // console.debug(styleEncoded);

    // Set encoding for the path
    const mapURL = new URL(result);
    const searchParams = mapURL.searchParams;

    searchParams.set('path', `enc:${searchParams.get('path')}`);
    // Add styles
    mapURL.search = searchParams.toString() + '&' + mapStylesParam;

    return mapURL.toString();
  }
}
