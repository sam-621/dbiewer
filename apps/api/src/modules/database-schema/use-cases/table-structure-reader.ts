import type z from 'zod';

import { ConnectionNotFoundError } from '@/modules/connection/connection-errors';
import {
  ConnectionFailedError,
  DbObjectNotFoundError,
  QueryFailedError
} from '@/modules/database-schema/database-schema-errors';
import { ReadTableStructureSchema } from '@/modules/database-schema/database-schema-schemas';
import type { UowContext } from '@/persistence/unit-of-work';
import type { EncryptionService } from '@/services/encryption';
import type { PostgresService, PostgresTableStructure } from '@/services/postgres';
import {
  PostgresConnectionFailedError,
  PostgresQueryFailedError
} from '@/services/postgres/postgres-errors';
import { UseCase } from '@/shared/use-case';

export class TableStructureReader extends UseCase<typeof ReadTableStructureSchema> {
  constructor(
    private readonly ctx: UowContext,
    private readonly encryptionService: EncryptionService,
    private readonly postgresService: PostgresService
  ) {
    super(ReadTableStructureSchema);
  }

  async run(
    input: z.output<typeof ReadTableStructureSchema>
  ): Promise<
    | PostgresTableStructure
    | ConnectionNotFoundError
    | ConnectionFailedError
    | DbObjectNotFoundError
    | QueryFailedError
  > {
    const connection = await this.ctx.repositories.connection.findOne({ id: input.connectionId });

    if (!connection) return new ConnectionNotFoundError(input.connectionId);

    const password = connection.passwordEncrypted
      ? this.encryptionService.decrypt(connection.passwordEncrypted, connection.id)
      : null;

    try {
      const structure = await this.postgresService.readTableStructure(
        { ...connection, password },
        { schema: input.schema, name: input.name }
      );

      if (!structure) return new DbObjectNotFoundError(input.schema, input.name);

      return structure;
    } catch (error) {
      if (error instanceof PostgresConnectionFailedError) {
        return new ConnectionFailedError(error.message);
      }
      if (error instanceof PostgresQueryFailedError) return new QueryFailedError(error.message);

      throw error;
    }
  }
}
