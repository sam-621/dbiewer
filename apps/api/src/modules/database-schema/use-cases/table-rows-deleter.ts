import z from 'zod';

import { ConnectionNotFoundError } from '@/modules/connection/connection-errors';
import {
  ConnectionFailedError,
  DbTableNotFoundError,
  PrimaryKeyRequiredError,
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
import { isPrimaryKey } from '@/shared/utils/primary-key';

const DeleteTableRowsSchema = z.object({
  connectionId: z.string(),
  schema: z.string(),
  name: z.string(),
  keys: z
    .array(
      z
        .array(
          z.object({
            column: z.string().min(1),
            value: z
              .string()
              .nullish()
              .transform(value => value ?? null)
          })
        )
        .refine(cells => new Set(cells.map(cell => cell.column)).size === cells.length, {
          message: 'Columns must not be repeated'
        })
    )
    .min(1)
});

export class TableRowsDeleter extends UseCase<typeof DeleteTableRowsSchema> {
  constructor(
    private readonly ctx: UowContext,
    private readonly encryptionService: EncryptionService,
    private readonly postgresService: PostgresService
  ) {
    super(DeleteTableRowsSchema);
  }

  async run(
    input: z.output<typeof DeleteTableRowsSchema>
  ): Promise<
    | number
    | ConnectionNotFoundError
    | ConnectionFailedError
    | DbTableNotFoundError
    | PrimaryKeyRequiredError
    | QueryFailedError
  > {
    const connection = await this.ctx.repositories.connection.findOne({
      where: { id: input.connectionId }
    });

    if (!connection) return new ConnectionNotFoundError(input.connectionId);

    const credentials = {
      ...connection,
      password: connection.passwordEncrypted
        ? this.encryptionService.decrypt(connection.passwordEncrypted, connection.id)
        : null
    };

    try {
      const primaryKeyColumns = await this.postgresService.readPrimaryKeyColumns(credentials, {
        schema: input.schema,
        name: input.name
      });

      if (!primaryKeyColumns) return new DbTableNotFoundError(input.schema, input.name);

      const hasInvalidKey = input.keys.some(
        key =>
          !isPrimaryKey(
            primaryKeyColumns,
            key.map(cell => cell.column)
          )
      );

      if (hasInvalidKey) {
        return new PrimaryKeyRequiredError(input.schema, input.name, primaryKeyColumns);
      }

      return await this.postgresService.deleteTableRows(credentials, {
        schema: input.schema,
        name: input.name,
        keys: input.keys
      });
    } catch (error) {
      if (error instanceof PostgresConnectionFailedError) {
        return new ConnectionFailedError(error.message);
      }
      if (error instanceof PostgresQueryFailedError) return new QueryFailedError(error.message);

      throw error;
    }
  }
}
