import z from 'zod';

import {
  ConnectionNameAlreadyExistsError,
  ConnectionNotFoundError
} from '@/modules/connection/connection-errors';
import type { Connection } from '@/persistence/repositories/connection';
import { connection } from '@/persistence/schema';
import type { UowContext } from '@/persistence/unit-of-work';
import type { EncryptionService } from '@/services/encryption';
import type { PostgresService } from '@/services/postgres';
import { UseCase } from '@/shared/use-case';

const UpdateConnectionSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1).max(50),
  host: z.string().trim().min(1),
  port: z.number().int().min(1).max(65535),
  database: z.string().trim().min(1),
  username: z.string().trim().min(1),
  password: z
    .string()
    .nullish()
    .transform(password => password || null),
  sslMode: z.enum(connection.sslMode.enumValues)
});

export class ConnectionUpdater extends UseCase<typeof UpdateConnectionSchema> {
  constructor(
    private readonly ctx: UowContext,
    private readonly encryptionService: EncryptionService,
    private readonly postgresService: PostgresService
  ) {
    super(UpdateConnectionSchema);
  }

  async run(
    input: z.output<typeof UpdateConnectionSchema>
  ): Promise<Connection | ConnectionNotFoundError | ConnectionNameAlreadyExistsError> {
    const { id, password, ...values } = input;
    const existing = await this.ctx.repositories.connection.findOne({ where: { id } });

    if (!existing) return new ConnectionNotFoundError(id);
    if (await this.ctx.repositories.connection.existsByName(values.name, id)) {
      return new ConnectionNameAlreadyExistsError(values.name);
    }

    const [updated] = await this.ctx.repositories.connection.update(
      { id },
      password
        ? { ...values, passwordEncrypted: this.encryptionService.encrypt(password, id) }
        : values
    );

    if (!updated) return new ConnectionNotFoundError(id);

    await this.postgresService.discardPool(id);

    return updated;
  }
}
