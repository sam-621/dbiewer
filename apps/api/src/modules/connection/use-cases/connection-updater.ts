import type z from 'zod';

import {
  ConnectionNameAlreadyExistsError,
  ConnectionNotFoundError
} from '@/modules/connection/connection-errors';
import { UpdateConnectionSchema } from '@/modules/connection/connection-schemas';
import type { Connection } from '@/persistence/repositories/connection';
import type { UowContext } from '@/persistence/unit-of-work';
import type { EncryptionService } from '@/services/encryption';
import { UseCase } from '@/shared/use-case';

export class ConnectionUpdater extends UseCase<typeof UpdateConnectionSchema> {
  constructor(
    private readonly ctx: UowContext,
    private readonly encryptionService: EncryptionService
  ) {
    super(UpdateConnectionSchema);
  }

  async run(
    input: z.output<typeof UpdateConnectionSchema>
  ): Promise<Connection | ConnectionNotFoundError | ConnectionNameAlreadyExistsError> {
    const { id, password, ...values } = input;
    const existing = await this.ctx.repositories.connection.findOne({ id });

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

    return updated ?? new ConnectionNotFoundError(id);
  }
}
