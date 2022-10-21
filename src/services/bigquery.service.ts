import { BigQuery, BigQueryOptions, Query } from '@google-cloud/bigquery';
import { LatLngLiteral } from '@googlemaps/google-maps-services-js';
import type { ATM } from '@interfaces/atm.interface';
import { Service } from 'typedi';

@Service()
export default class BigQueryService {
  bigquery: BigQuery;

  constructor(options: BigQueryOptions) {
    this.bigquery = new BigQuery(options);
  }

  async getClosestATMs(userLocation: LatLngLiteral, limit: number) {
    const sqlQuery = `--sql
      SELECT atm_with_distance.* FROM (
        SELECT ST_DISTANCE(
          ST_GEOGPOINT(
            SAFE_CAST(atm_data.longitud AS FLOAT64),
            SAFE_CAST(atm_data.latitud AS FLOAT64)
          ), 
          ST_GEOGPOINT(@userLongitude, @userLatitude)
          ) AS straight_distance,
        *
        FROM \`voice-enabled-dialogflow.atms_dataset.atms_data\` atm_data
      ) AS atm_with_distance

      WHERE atm_with_distance.straight_distance IS NOT NULL

      ORDER BY atm_with_distance.straight_distance
      LIMIT @limit
    `;

    const query: Query = {
      query: sqlQuery,
      params: {
        userLatitude: userLocation.lat,
        userLongitude: userLocation.lng,
        limit,
      },
      types: {
        userLatitude: 'FLOAT64',
        userLongitude: 'FLOAT64',
        limit: 'INT64',
      },
    };

    const [rows] = await this.bigquery.query(query);

    return rows as ATM[];
  }

  async getClosestATM(userLocation: LatLngLiteral) {
    return (await this.getClosestATMs(userLocation, 1))[0];
  }
}
