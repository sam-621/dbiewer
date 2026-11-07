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

const CellValuesSchema = z
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
  });

const SaveTableChangesSchema = z
  .object({
    connectionId: z.string(),
    schema: z.string(),
    name: z.string(),
    updates: z.array(
      z.object({
        key: CellValuesSchema,
        values: CellValuesSchema.refine(cells => cells.length > 0, {
          message: 'An update must have at least one value'
        })
      })
    ),
    inserts: z.array(z.object({ values: CellValuesSchema }))
  })
  .refine(input => input.updates.length + input.inserts.length > 0, {
    message: 'There must be at least one update or insert'
  });

export class TableChangesSaver extends UseCase<typeof SaveTableChangesSchema> {
  constructor(
    private readonly ctx: UowContext,
    private readonly encryptionService: EncryptionService,
    private readonly postgresService: PostgresService
  ) {
    super(SaveTableChangesSchema);
  }

  async run(
    input: z.output<typeof SaveTableChangesSchema>
  ): Promise<
    | true
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

      const hasInvalidKey = input.updates.some(
        update =>
          !isPrimaryKey(
            primaryKeyColumns,
            update.key.map(cell => cell.column)
          )
      );

      if (hasInvalidKey) {
        return new PrimaryKeyRequiredError(input.schema, input.name, primaryKeyColumns);
      }

      await this.postgresService.saveTableChanges(credentials, {
        schema: input.schema,
        name: input.name,
        updates: input.updates,
        inserts: input.inserts
      });

      return true;
    } catch (error) {
      if (error instanceof PostgresConnectionFailedError) {
        return new ConnectionFailedError(error.message);
      }
      if (error instanceof PostgresQueryFailedError) return new QueryFailedError(error.message);

      throw error;
    }
  }
}
