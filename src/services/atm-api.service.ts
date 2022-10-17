import { LatLngLiteral } from '@googlemaps/google-maps-services-js';
import { ApiATM, toATM } from '@interfaces/atm-api.interface';
import IATMService from '@services/interfaces/atm.service.interface';
import fetch from 'node-fetch';
import { Service } from 'typedi';

@Service()
export class ApiATMService implements IATMService {
  async getATMs(location: LatLngLiteral) {
    const now = new Date();

    const bodyParams: Record<string, any> = {
      metodo: 'getPuntos',
      latitud: location.lat,
      longitud: location.lng,
      idOpcionCatalogo: 11,
      idOpcionAtributo: 14,
      dia: now.getDay(),
      hora: '0:0',
      ubicacion: 1,
      direccion: 0,
      // fecha: now.toString(),
    };

    // Build form data
    const formBody = [];
    for (const property in bodyParams) {
      const encodedKey = encodeURIComponent(property);
      const encodedValue = encodeURIComponent(bodyParams[property]);
      formBody.push(encodedKey + '=' + encodedValue);
    }

    const apiResponse = await fetch('https://www.strategis.mx/Glocator/common/services/Buscador.ashx', {
      body: formBody.join('&'),
      method: 'POST',

      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      },
    });

    const data = ((await apiResponse.json()) as any).Obj as ApiATM[];

    return data.map(apiATM => toATM(apiATM));
  }
}

export default new ApiATMService();
