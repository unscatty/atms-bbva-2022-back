import { LatLng } from '@googlemaps/google-maps-services-js';

// Interface we'll use with csv files
export interface ATM {
  id?: number;
  sitio?: string;
  // ¿Código de región?
  cr?: number;
  division?: string;
  marca?: number;
  tipoDispositivo?: string;
  estatus?: string;
  calle?: string;
  numExt?: string;
  estado?: string;
  ciudad?: string;
  cp?: string;
  // Delegación/Municipio
  delMuni?: string;
  colonia?: string;
  latitud?: number;
  longitud?: number;
}

export const generateDescriptions = (atm: ATM): { name: string; value?: string }[] => {
  const { sitio, calle, numExt, estado, colonia, delMuni } = atm;

  return [
    {
      name: 'Nombre',
      value: sitio,
    },
    {
      name: 'Calle',
      value: calle,
    },
    {
      name: 'Número Exterior',
      value: numExt,
    },
    {
      name: 'Estado',
      value: estado,
    },
    {
      name: 'Colonia',
      value: colonia,
    },
    {
      name: 'Delegación/Municipio',
      value: delMuni,
    },
  ];
};

export const atmToLatLng = (atm: ATM): LatLng => {
  return { lat: atm.latitud || 0, lng: atm.longitud || 0 };
};
