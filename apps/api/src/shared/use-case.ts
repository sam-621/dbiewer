import z from 'zod';

import { InvalidInputError } from '@/shared/errors/invalid-input-error';

export abstract class UseCase<TSchema extends z.ZodType> {
  constructor(protected readonly schema: TSchema) {}

  abstract run(input: z.output<TSchema>): Promise<unknown>;

  async execute(
    input: z.input<TSchema>
  ): Promise<Awaited<ReturnType<this['run']>> | InvalidInputError> {
    const parsed = this.schema.safeParse(input);

    if (!parsed.success) return new InvalidInputError(z.prettifyError(parsed.error));

    return this.run(parsed.data) as Awaited<ReturnType<this['run']>>;
  }
}
