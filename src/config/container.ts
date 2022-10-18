import { Container } from 'typedi';
import ApiATMService from '@services/atm-api.service';
import IATMService from '@services/interfaces/atm.service.interface';

export const setDependencies = () => {
  Container.set(IATMService, new ApiATMService());
};
