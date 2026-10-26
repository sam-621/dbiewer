import { ConnectionNotFoundError } from '@/modules/connection/connection-errors';
import { ConnectionFailedError } from '@/modules/database-schema/database-schema-errors';
import { ReadConnectionSchemaSchema } from '@/modules/database-schema/database-schema-schemas';
import type { UowContext } from '@/persistence/unit-of-work';
import type { EncryptionService } from '@/services/encryption';
import type { PostgresSchema, PostgresService } from '@/services/postgres';
import { PostgresConnectionFailedError } from '@/services/postgres/postgres-errors';
import { UseCase } from '@/shared/use-case';

export class ConnectionSchemaReader extends UseCase<typeof ReadConnectionSchemaSchema> {
  constructor(
    private readonly ctx: UowContext,
    private readonly encryptionService: EncryptionService,
    private readonly postgresService: PostgresService
  ) {
    super(ReadConnectionSchemaSchema);
  }

  async run(
    connectionId: string
  ): Promise<PostgresSchema[] | ConnectionNotFoundError | ConnectionFailedError> {
    const connection = await this.ctx.repositories.connection.findOne({ id: connectionId });

    if (!connection) return new ConnectionNotFoundError(connectionId);

    const password = connection.passwordEncrypted
      ? this.encryptionService.decrypt(connection.passwordEncrypted, connection.id)
      : null;

    try {
      return await this.postgresService.readSchemas({ ...connection, password });
    } catch (error) {
      if (error instanceof PostgresConnectionFailedError) {
        return new ConnectionFailedError(error.message);
      }

      throw error;
    }
  }
}
