import { Client as MapsClient, DirectionsResponseData, Language, LatLngLiteral, TravelMode, UnitSystem } from '@googlemaps/google-maps-services-js';
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

  async getDirections(from: LatLngLiteral, to: LatLngLiteral, travelMode: TravelMode) {
    const response = await this.mapsClient.directions({
      params: {
        key: this.API_KEY,
        origin: from,
        destination: to,
        language: Language.es,
        units: UnitSystem.metric,
        mode: travelMode,
      },
    });

    return response.data;
  }

  async getDirectionsImage(
    from: LatLngLiteral,
    to: LatLngLiteral,
    directions?: DirectionsResponseData,
    travelMode?: TravelMode,
    size = { width: 1200, height: 1200 }
  ) {
    if (!travelMode) {
      travelMode = TravelMode.driving;
    }

    if (!directions) {
      directions = await this.getDirections(from, to, travelMode);
    }

    const result = await asyncStaticMapUrl({
      key: this.API_KEY,
      size: `${size.width}x${size.height}`,
      // style: styleEncoded,
      markers: [
        {
          location: from,
        },
        {
          location: to,
        },
      ],
      paths: directions.routes.map(route => route.overview_polyline),
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
