import type { ATM } from '@interfaces/atm.interface';

export default abstract class IATMService {
  abstract getATMs: (...args: any[]) => ATM[] | Promise<ATM[]>;
}
