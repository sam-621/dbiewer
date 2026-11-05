import z from 'zod';

import { ConnectionNotFoundError } from '@/modules/connection/connection-errors';
import {
  ConnectionFailedError,
  QueryFailedError
} from '@/modules/database-schema/database-schema-errors';
import type { UowContext } from '@/persistence/unit-of-work';
import type { EncryptionService } from '@/services/encryption';
import type { PostgresDiagram, PostgresService } from '@/services/postgres';
import {
  PostgresConnectionFailedError,
  PostgresQueryFailedError
} from '@/services/postgres/postgres-errors';
import { UseCase } from '@/shared/use-case';

const ReadSchemaDiagramSchema = z.string();

export class SchemaDiagramReader extends UseCase<typeof ReadSchemaDiagramSchema> {
  constructor(
    private readonly ctx: UowContext,
    private readonly encryptionService: EncryptionService,
    private readonly postgresService: PostgresService
  ) {
    super(ReadSchemaDiagramSchema);
  }

  async run(
    connectionId: string
  ): Promise<PostgresDiagram | ConnectionNotFoundError | ConnectionFailedError | QueryFailedError> {
    const connection = await this.ctx.repositories.connection.findOne({
      where: { id: connectionId }
    });

    if (!connection) return new ConnectionNotFoundError(connectionId);

    const password = connection.passwordEncrypted
      ? this.encryptionService.decrypt(connection.passwordEncrypted, connection.id)
      : null;

    try {
      return await this.postgresService.readDiagram({ ...connection, password });
    } catch (error) {
      if (error instanceof PostgresConnectionFailedError) {
        return new ConnectionFailedError(error.message);
      }
      if (error instanceof PostgresQueryFailedError) return new QueryFailedError(error.message);

      throw error;
    }
  }
}
