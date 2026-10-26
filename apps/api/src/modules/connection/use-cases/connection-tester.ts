import type z from 'zod';

import { TestConnectionSchema } from '@/modules/connection/connection-schemas';
import type { PostgresService } from '@/services/postgres';
import { PostgresConnectionFailedError } from '@/services/postgres/postgres-errors';
import { UseCase } from '@/shared/use-case';

export class ConnectionTester extends UseCase<typeof TestConnectionSchema> {
  constructor(private readonly postgresService: PostgresService) {
    super(TestConnectionSchema);
  }

  async run(input: z.output<typeof TestConnectionSchema>): Promise<boolean> {
    try {
      await this.postgresService.testConnection(input);

      return true;
    } catch (error) {
      if (error instanceof PostgresConnectionFailedError) return false;

      throw error;
    }
  }
}
