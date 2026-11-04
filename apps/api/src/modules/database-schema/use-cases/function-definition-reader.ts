import z from 'zod';

import { ConnectionNotFoundError } from '@/modules/connection/connection-errors';
import {
  ConnectionFailedError,
  DbFunctionNotFoundError,
  QueryFailedError
} from '@/modules/database-schema/database-schema-errors';
import type { UowContext } from '@/persistence/unit-of-work';
import type { EncryptionService } from '@/services/encryption';
import type { PostgresService } from '@/services/postgres';
import {
  PostgresConnectionFailedError,
  PostgresQueryFailedError
} from '@/services/postgres/postgres-errors';
import { UseCase } from '@/shared/use-case';

const ReadFunctionDefinitionSchema = z.object({
  connectionId: z.string(),
  schema: z.string(),
  name: z.string(),
  arguments: z.string()
});

export class FunctionDefinitionReader extends UseCase<typeof ReadFunctionDefinitionSchema> {
  constructor(
    private readonly ctx: UowContext,
    private readonly encryptionService: EncryptionService,
    private readonly postgresService: PostgresService
  ) {
    super(ReadFunctionDefinitionSchema);
  }

  async run(
    input: z.output<typeof ReadFunctionDefinitionSchema>
  ): Promise<
    | string
    | ConnectionNotFoundError
    | ConnectionFailedError
    | DbFunctionNotFoundError
    | QueryFailedError
  > {
    const connection = await this.ctx.repositories.connection.findOne({ id: input.connectionId });

    if (!connection) return new ConnectionNotFoundError(input.connectionId);

    const password = connection.passwordEncrypted
      ? this.encryptionService.decrypt(connection.passwordEncrypted, connection.id)
      : null;

    try {
      const definition = await this.postgresService.readFunctionDefinition(
        { ...connection, password },
        { schema: input.schema, name: input.name, arguments: input.arguments }
      );

      if (definition === null) {
        return new DbFunctionNotFoundError(input.schema, input.name, input.arguments);
      }

      return definition;
    } catch (error) {
      if (error instanceof PostgresConnectionFailedError) {
        return new ConnectionFailedError(error.message);
      }
      if (error instanceof PostgresQueryFailedError) return new QueryFailedError(error.message);

      throw error;
    }
  }
}
