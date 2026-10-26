import z from 'zod';

import { ConnectionNotFoundError } from '@/modules/connection/connection-errors';
import type { UowContext } from '@/persistence/unit-of-work';
import type { PostgresService } from '@/services/postgres';
import { UseCase } from '@/shared/use-case';

const RemoveConnectionSchema = z.string();

export class ConnectionRemover extends UseCase<typeof RemoveConnectionSchema> {
  constructor(
    private readonly ctx: UowContext,
    private readonly postgresService: PostgresService
  ) {
    super(RemoveConnectionSchema);
  }

  async run(id: string): Promise<true | ConnectionNotFoundError> {
    const [removed] = await this.ctx.repositories.connection.remove({ id });

    if (!removed) return new ConnectionNotFoundError(id);

    await this.postgresService.discardPool(id);

    return true;
  }
}
