import { Container, Token } from 'typedi';
import ApiATMService from '@services/atm-api.service';
import IATMService from '@services/interfaces/atm.service.interface';
import { GOOGLE_MAPS_API_KEY } from '@config';

export const GOOGLE_MAPS_API_KEY_TOKEN = new Token<string>('GOOGLE_MAPS_API_KEY_TOKEN');

export const setDependencies = () => {
  Container.set(GOOGLE_MAPS_API_KEY_TOKEN, GOOGLE_MAPS_API_KEY);
  Container.set(IATMService, new ApiATMService());
};
