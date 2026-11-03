import type z from 'zod';

import { ConnectionNotFoundError } from '@/modules/connection/connection-errors';
import {
  ConnectionFailedError,
  QueryFailedError
} from '@/modules/database-schema/database-schema-errors';
import { RunQuerySchema } from '@/modules/query/query-schemas';
import type { UowContext } from '@/persistence/unit-of-work';
import type { EncryptionService } from '@/services/encryption';
import type { PostgresQueryExecution, PostgresService } from '@/services/postgres';
import {
  PostgresConnectionFailedError,
  PostgresQueryFailedError
} from '@/services/postgres/postgres-errors';
import { UseCase } from '@/shared/use-case';

export class QueryRunner extends UseCase<typeof RunQuerySchema> {
  constructor(
    private readonly ctx: UowContext,
    private readonly encryptionService: EncryptionService,
    private readonly postgresService: PostgresService
  ) {
    super(RunQuerySchema);
  }

  async run(
    input: z.output<typeof RunQuerySchema>
  ): Promise<
    PostgresQueryExecution | ConnectionNotFoundError | ConnectionFailedError | QueryFailedError
  > {
    const connection = await this.ctx.repositories.connection.findOne({ id: input.connectionId });

    if (!connection) return new ConnectionNotFoundError(input.connectionId);

    const password = connection.passwordEncrypted
      ? this.encryptionService.decrypt(connection.passwordEncrypted, connection.id)
      : null;

    try {
      return await this.postgresService.runQuery({ ...connection, password }, input.sql);
    } catch (error) {
      if (error instanceof PostgresConnectionFailedError) {
        return new ConnectionFailedError(error.message);
      }
      if (error instanceof PostgresQueryFailedError) return new QueryFailedError(error.message);

      throw error;
    }
  }
}
