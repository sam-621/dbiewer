import { BusinessError } from './business-error';

export class InvalidInputError extends BusinessError<'INVALID_INPUT'> {
  constructor(message: string) {
    super('INVALID_INPUT', message);
  }
}
