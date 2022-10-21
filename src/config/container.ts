import { GOOGLE_MAPS_API_KEY } from '@config';
import { BigQueryOptions } from '@google-cloud/bigquery';
import ATMService from '@services/atm.service';
import BigQueryService from '@services/bigquery.service';
import IATMService from '@services/interfaces/atm.service.interface';
import { Container, Token } from 'typedi';

export const GOOGLE_MAPS_API_KEY_TOKEN = new Token<string>('GOOGLE_MAPS_API_KEY_TOKEN');
export const DEFAULT_BIGQUERY_OPTIONS_TOKEN = new Token<BigQueryOptions>('DEFAULT_BIGQUERY_OPTIONS');

const defaultBigQueryOptions = {
  location: 'US',
};

export const setDependencies = () => {
  Container.set(GOOGLE_MAPS_API_KEY_TOKEN, GOOGLE_MAPS_API_KEY);
  Container.set(DEFAULT_BIGQUERY_OPTIONS_TOKEN, defaultBigQueryOptions);

  // Container.set(IATMService, new ApiATMService());
  Container.set(IATMService, new ATMService(new BigQueryService(Container.get(DEFAULT_BIGQUERY_OPTIONS_TOKEN))));
};
