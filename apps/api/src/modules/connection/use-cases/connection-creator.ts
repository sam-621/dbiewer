import z from 'zod';

import { ConnectionNameAlreadyExistsError } from '@/modules/connection/connection-errors';
import type { Connection } from '@/persistence/repositories/connection';
import { connection } from '@/persistence/schema';
import type { UowContext } from '@/persistence/unit-of-work';
import type { EncryptionService } from '@/services/encryption';
import { UseCase } from '@/shared/use-case';

const CreateConnectionSchema = z.object({
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

export class ConnectionCreator extends UseCase<typeof CreateConnectionSchema> {
  constructor(
    private readonly ctx: UowContext,
    private readonly encryptionService: EncryptionService
  ) {
    super(CreateConnectionSchema);
  }

  async run(
    input: z.output<typeof CreateConnectionSchema>
  ): Promise<Connection | ConnectionNameAlreadyExistsError> {
    if (await this.ctx.repositories.connection.existsByName(input.name)) {
      return new ConnectionNameAlreadyExistsError(input.name);
    }

    const { password, ...values } = input;
    const id = crypto.randomUUID();

    return this.ctx.repositories.connection.insert({
      ...values,
      id,
      passwordEncrypted: password ? this.encryptionService.encrypt(password, id) : null
    });
  }
}
