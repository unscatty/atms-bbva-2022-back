import { LatLngLiteral } from '@googlemaps/google-maps-services-js';
import { Body, Controller, Post } from 'routing-controllers';
import { Service } from 'typedi';
import IATMService from '@services/interfaces/atm.service.interface';

@Service()
@Controller('/atms')
export default class ATMsController {
  constructor(private atmService: IATMService) {}

  @Post()
  nearby(@Body() body: { location: LatLngLiteral; limit: number }) {
    return this.atmService.getClosestATMs(body.location, body.limit);
  }
}
