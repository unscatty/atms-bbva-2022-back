import { LatLngLiteral } from '@googlemaps/google-maps-services-js';
import { LocationPayload } from '@interfaces/dialogflow-webhooks/streaming-payload.interface';
import IATMService from '@services/interfaces/atm.service.interface';
import MapsService from '@services/maps.service';
import { Body, Controller, Post } from 'routing-controllers';
import { Service } from 'typedi';
import { type PayloadedWebhookResponse } from 'types/webhooks';
import { IWebhookRequest } from '../dialogflowcx';
import { ATM } from '../interfaces/atm.interface';

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

  private async routeToATM(data: LocationWebhookRequest): Promise<PayloadedWebhookResponse> {
    const sessionLastAmtLocation = data.sessionInfo?.parameters?.last_amt_location;

    console.debug(sessionLastAmtLocation.structValue.fields);

    const lastAmtLocation: LatLngLiteral = {
      lat: sessionLastAmtLocation.structValue?.fields?.lat?.numberValue,
      lng: sessionLastAmtLocation.structValue?.fields?.lng?.numberValue,
    };

    const directionsImage = await this.mapService.getDirectionsImage(data.payload.location, lastAmtLocation);
    console.debug(directionsImage);

    return {
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
        ],
      },
    };
  }

  private async closestATM(data: LocationWebhookRequest): Promise<DialogFlowCX.IWebhookResponse> {
    const closestATMs = await this.atmService.getClosestATMs(data.payload.location);
    // console.debug(closestATMs);
    // const closest = await this.atmService.getClosestATMs(data.payload.location)[0];

    const closest = closestATMs[0];
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
      textReponse += ` la calle ${atm.calle}`;
    }

    if (atm.numExt) {
      textReponse += `, número ${atm.numExt}`;
    }

    if (atm.colonia) {
      textReponse += ` en la colonia ${atm.colonia}`;
    }

    if (atm.delMuni) {
      textReponse += ` en la delegación ${atm.delMuni}`;
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
