import { LatLngLiteral, TravelMode } from '@googlemaps/google-maps-services-js';
import { LocationPayload } from '@interfaces/dialogflow-webhooks/streaming-payload.interface';
import IATMService from '@services/interfaces/atm.service.interface';
import MapsService from '@services/maps.service';
import { Body, Controller, Post } from 'routing-controllers';
import { Service } from 'typedi';
import { type PayloadedWebhookResponse } from 'types/webhooks';
import { IWebhookRequest } from '../dialogflowcx';
import { ATM } from '../interfaces/atm.interface';
import { capitalize } from '@utils/strings';

export type LocationWebhookRequest = IWebhookRequest & {
  payload: LocationPayload;
};

@Service()
@Controller()
export class DialogFlowWebhookController {
  constructor(private atmService: IATMService, private mapService: MapsService) {}

  @Post('/location-webhooks')
  async locationWebhook(@Body() data: LocationWebhookRequest): Promise<DialogFlowCX.IWebhookResponse> {
    if (!data.payload?.location) {
      return {
        fulfillmentResponse: {
          messages: [
            {
              text: {
                text: ['Necesitas proporcionar tu ubicación para usar esta función'],
              },
            },
          ],
        },
      };
    }

    const { tag } = data.fulfillmentInfo;

    console.debug(data.payload);

    switch (tag) {
      case 'closest-atm':
        return this.closestATM(data);
      case 'route-to-atm':
        return this.routeToATM(data);
      case 'travel-by-bike':
        return this.routeToATM(data, TravelMode.bicycling);
      case 'travel-by-driving':
        return this.routeToATM(data, TravelMode.driving);
      case 'travel-by-transit':
        return this.routeToATM(data, TravelMode.transit);
      case 'travel-by-walking':
        return this.routeToATM(data, TravelMode.walking);
      default:
        return {
          fulfillmentResponse: {
            messages: [
              {
                text: {
                  text: ['Esa acción aún no está disponible'],
                },
              },
            ],
          },
        };
    }
  }

  private async routeToATM(data: LocationWebhookRequest, injectedTravelMode?: TravelMode): Promise<PayloadedWebhookResponse> {
    const sessionLastAmtLocation = data.sessionInfo?.parameters?.last_amt_location;
    const travelModeSessionValue = data.sessionInfo?.parameters?.last_travel_mode;

    let travelMode: TravelMode;

    if (!travelModeSessionValue) {
      travelMode = TravelMode.driving;
    } else {
      travelMode = TravelMode[travelModeSessionValue.stringValue];
    }

    if (injectedTravelMode) {
      // Override travel mode if recognized from intent
      travelMode = injectedTravelMode;
    }

    console.debug(data.sessionInfo.parameters);

    // console.debug(sessionLastAmtLocation.structValue.fields);

    const lastAmtLocation: LatLngLiteral = {
      lat: sessionLastAmtLocation.structValue?.fields?.lat?.numberValue,
      lng: sessionLastAmtLocation.structValue?.fields?.lng?.numberValue,
    };

    const directions = await this.mapService.getDirections(data.payload.location, lastAmtLocation, travelMode);

    const directionsImage = await this.mapService.getDirectionsImage(data.payload.location, lastAmtLocation, directions);
    console.debug(directionsImage);

    return {
      sessionInfo: {
        ...data.sessionInfo,
        parameters: {
          ...data.sessionInfo?.parameters,
          last_travel_mode: {
            stringValue: travelMode,
          },
        },
      },
      fulfillmentResponse: {
        messages: [
          {
            text: {
              text: ['Aquí está la ruta'],
            },
          },
          {
            payload: {
              mapImageSrc: directionsImage,
            },
          },
          {
            text: {
              text: [`La distancia aproximada es de ${directions.routes[0].legs[0].distance.text} ${this.getRouteTransportName(travelMode)}`],
            },
          },
        ],
      },
    };
  }

  private getRouteTransportName(travelMode: TravelMode) {
    switch (travelMode) {
      case TravelMode.bicycling:
        return 'en bicicleta';
      case TravelMode.driving:
        return 'conduciendo';
      case TravelMode.transit:
        return 'en transporte';
      case TravelMode.walking:
        return 'caminando';
      default:
        return '';
    }
  }

  private async closestATM(data: LocationWebhookRequest): Promise<DialogFlowCX.IWebhookResponse> {
    // const closestATMs = await this.atmService.getClosestATMs(data.payload.location);
    // console.debug(closestATMs);
    // const closest = await this.atmService.getClosestATMs(data.payload.location)[0];

    const closest = await this.atmService.getClosestATM(data.payload.location);

    console.debug(closest);
    let sessionInfo = null;

    let messages = [
      {
        text: {
          text: ['No se encontró un cajero BBVA cercano a tu ubicación'],
        },
      },
    ];

    if (closest) {
      messages = this.buildATMTextResponse(closest);

      sessionInfo = {
        parameters: {
          last_amt_location: {
            structValue: {
              fields: {
                lat: {
                  numberValue: closest.latitud,
                },
                lng: {
                  numberValue: closest.longitud,
                },
              },
            },
          },
        },
      };
    }

    return {
      sessionInfo,
      fulfillmentResponse: {
        messages,
      },
    };
  }

  private buildATMTextResponse(atm: ATM) {
    let textReponse = 'El cajero BBVA más cercano a tu ubicación se encuenta en';

    if (atm.calle) {
      textReponse += ` la calle ${capitalize(atm.calle)}`;
    }

    if (atm.numExt) {
      textReponse += `, número ${capitalize(atm.numExt)}`;
    }

    if (atm.colonia) {
      textReponse += ` en la colonia ${capitalize(atm.colonia)}`;
    }

    if (atm.delMuni) {
      textReponse += ` en la delegación ${capitalize(atm.delMuni)}`;
    }

    return [
      {
        text: {
          text: [textReponse],
        },
      },
      {
        text: {
          text: ['¿Te gustaría ver la ruta hacia ese cajero?'],
        },
      },
    ];

    // return [textReponse, ];
  }
}
