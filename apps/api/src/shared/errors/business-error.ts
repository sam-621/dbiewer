import { DbiewerError } from './dbiewer-error';

export abstract class BusinessError<TCode extends string = string> extends DbiewerError {
  constructor(
    readonly code: TCode,
    message: string
  ) {
    super(message);
  }
}
