import { LatLngLiteral } from '@googlemaps/google-maps-services-js';
import { Body, Controller, Post } from 'routing-controllers';
import { Service } from 'typedi';
import IATMService from '../services/interfaces/atm.service.interface';
// import { ApiATMService } from '../services/atm-api.service';

@Service()
@Controller('/atms')
export default class ATMsController {
  // private atmService: IATMService;
  constructor(private atmService: IATMService) {
    // this.atmService = new ApiATMService();
  }

  @Post()
  nearby(@Body() body: { location: LatLngLiteral; limit: number }) {
    return this.atmService.getClosestATMs(body.location, body.limit);
  }
}
