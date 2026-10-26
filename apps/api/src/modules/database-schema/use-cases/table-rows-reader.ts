import type z from 'zod';

import { ConnectionNotFoundError } from '@/modules/connection/connection-errors';
import {
  ConnectionFailedError,
  DbObjectNotFoundError,
  QueryFailedError
} from '@/modules/database-schema/database-schema-errors';
import { ReadTableRowsSchema } from '@/modules/database-schema/database-schema-schemas';
import type { UowContext } from '@/persistence/unit-of-work';
import type { EncryptionService } from '@/services/encryption';
import type { PostgresService, PostgresTableRows } from '@/services/postgres';
import {
  PostgresConnectionFailedError,
  PostgresQueryFailedError
} from '@/services/postgres/postgres-errors';
import { InvalidInputError } from '@/shared/errors/invalid-input-error';
import { UseCase } from '@/shared/use-case';

type TableRows = PostgresTableRows & { columns: Array<{ name: string; type: string }> };

export class TableRowsReader extends UseCase<typeof ReadTableRowsSchema> {
  constructor(
    private readonly ctx: UowContext,
    private readonly encryptionService: EncryptionService,
    private readonly postgresService: PostgresService
  ) {
    super(ReadTableRowsSchema);
  }

  async run(
    input: z.output<typeof ReadTableRowsSchema>
  ): Promise<
    | TableRows
    | ConnectionNotFoundError
    | ConnectionFailedError
    | DbObjectNotFoundError
    | InvalidInputError
    | QueryFailedError
  > {
    const connection = await this.ctx.repositories.connection.findOne({ id: input.connectionId });

    if (!connection) return new ConnectionNotFoundError(input.connectionId);

    const credentials = {
      ...connection,
      password: connection.passwordEncrypted
        ? this.encryptionService.decrypt(connection.passwordEncrypted, connection.id)
        : null
    };

    try {
      const structure = await this.postgresService.readTableStructure(credentials, {
        schema: input.schema,
        name: input.name
      });

      if (!structure) return new DbObjectNotFoundError(input.schema, input.name);

      const columnNames = structure.columns.map(column => column.name);
      const unknownColumn = [
        ...input.filters.map(filter => filter.column),
        ...(input.orderBy ? [input.orderBy.column] : [])
      ].find(column => !columnNames.includes(column));

      if (unknownColumn !== undefined) {
        return new InvalidInputError(
          `Column ${unknownColumn} does not exist in ${input.schema}.${input.name}`
        );
      }

      const tableRows = await this.postgresService.readTableRows(credentials, {
        schema: input.schema,
        name: input.name,
        filters: input.filters,
        orderBy: input.orderBy ?? null,
        primaryKeyColumns: structure.columns
          .filter(column => column.isPrimaryKey)
          .map(column => column.name),
        page: input.page
      });

      return {
        columns: structure.columns.map(column => ({ name: column.name, type: column.type })),
        ...tableRows
      };
    } catch (error) {
      if (error instanceof PostgresConnectionFailedError) {
        return new ConnectionFailedError(error.message);
      }
      if (error instanceof PostgresQueryFailedError) return new QueryFailedError(error.message);

      throw error;
    }
  }
}
