import z from 'zod';

import { FileNotFoundError } from '@/modules/file/file-errors';
import type { UowContext } from '@/persistence/unit-of-work';
import { UseCase } from '@/shared/use-case';

const RemoveFileSchema = z.string();

export class FileRemover extends UseCase<typeof RemoveFileSchema> {
  constructor(private readonly ctx: UowContext) {
    super(RemoveFileSchema);
  }

  async run(id: string): Promise<true | FileNotFoundError> {
    const [removed] = await this.ctx.repositories.file.remove({ id });

    if (!removed) return new FileNotFoundError(id);

    return true;
  }
}
