import { LatLngLiteral } from '@googlemaps/google-maps-services-js';
import ApiATMService from '@services/atm-api.service';
import { Body, Controller, Post } from 'routing-controllers';
import { Service } from 'typedi';
// import { ApiATMService } from '../services/atm-api.service';

@Service()
@Controller('/atms')
export default class ATMsController {
  // private atmService: IATMService;
  constructor(private atmService: ApiATMService) {
    // this.atmService = new ApiATMService();
  }

  @Post()
  nearby(@Body() body: { location: LatLngLiteral }) {
    return this.atmService.getATMs(body.location);
  }
}
