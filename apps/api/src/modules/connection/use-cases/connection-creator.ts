import type z from 'zod';

import { ConnectionNameAlreadyExistsError } from '@/modules/connection/connection-errors';
import { CreateConnectionSchema } from '@/modules/connection/connection-schemas';
import type { Connection } from '@/persistence/repositories/connection';
import type { UowContext } from '@/persistence/unit-of-work';
import type { EncryptionService } from '@/services/encryption';
import { UseCase } from '@/shared/use-case';

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
