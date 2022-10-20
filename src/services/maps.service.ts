import { Client as MapsClient, Language, LatLngLiteral, UnitSystem } from '@googlemaps/google-maps-services-js';
import { asyncStaticMapUrl } from 'static-google-map';

export default class MapsService {
  API_KEY: string;
  mapsClient: MapsClient;

  constructor(apiKey: string) {
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

    // const render = this.mapsClient.ren;

    const result = await asyncStaticMapUrl({
      key: this.API_KEY,
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

    return result;
  }
}
