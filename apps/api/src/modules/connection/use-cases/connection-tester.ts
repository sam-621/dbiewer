import z from 'zod';

import { connection } from '@/persistence/schema';
import type { PostgresService } from '@/services/postgres';
import { PostgresConnectionFailedError } from '@/services/postgres/postgres-errors';
import { UseCase } from '@/shared/use-case';

const TestConnectionSchema = z
  .object({
    host: z.string().nullish(),
    port: z.number().nullish(),
    database: z.string().nullish(),
    username: z.string().nullish(),
    password: z.string().nullish(),
    sslMode: z.enum(connection.sslMode.enumValues).nullish()
  })
  .pipe(
    z.object({
      host: z.string().trim().min(1),
      port: z.number().int().min(1).max(65535),
      database: z.string().trim().min(1),
      username: z.string().trim().min(1),
      password: z
        .string()
        .nullish()
        .transform(password => password || null),
      sslMode: z.enum(connection.sslMode.enumValues)
    })
  );

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
