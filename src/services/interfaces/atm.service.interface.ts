import type { ATM } from '@interfaces/atm.interface';

export default interface IATMService {
  // eslint-disable-next-line no-unused-vars
  getATMs: (...args: any[]) => ATM[] | Promise<ATM[]>;
}
