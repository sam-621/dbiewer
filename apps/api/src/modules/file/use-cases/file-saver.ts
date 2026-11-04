import z from 'zod';

import { ConnectionNotFoundError } from '@/modules/connection/connection-errors';
import { FileNameAlreadyExistsError, FileNotFoundError } from '@/modules/file/file-errors';
import type { File } from '@/persistence/repositories/file';
import { file } from '@/persistence/schema';
import type { UowContext } from '@/persistence/unit-of-work';
import { UseCase } from '@/shared/use-case';

const SaveFileFieldsSchema = z.object({
  id: z.string().nullish(),
  connectionId: z.string(),
  name: z.string().trim(),
  type: z.enum(file.type.enumValues),
  content: z.string()
});

const SaveFileSchema = SaveFileFieldsSchema.transform(input => ({
  ...input,
  name: input.name.replace(new RegExp(`\\.${input.type}$`, 'i'), '')
})).pipe(SaveFileFieldsSchema.extend({ name: z.string().trim().min(1).max(100) }));

type SaveFileInput = z.output<typeof SaveFileSchema>;

export class FileSaver extends UseCase<typeof SaveFileSchema> {
  constructor(private readonly ctx: UowContext) {
    super(SaveFileSchema);
  }

  async run(
    input: SaveFileInput
  ): Promise<File | ConnectionNotFoundError | FileNotFoundError | FileNameAlreadyExistsError> {
    const connection = await this.ctx.repositories.connection.findOne({ id: input.connectionId });

    if (!connection) return new ConnectionNotFoundError(input.connectionId);

    return input.id ? this.update(input.id, input) : this.create(input);
  }

  private async create(input: SaveFileInput): Promise<File | FileNameAlreadyExistsError> {
    const { connectionId, name, type, content } = input;

    const taken = await this.ctx.repositories.file.findOne({ connectionId, type, name });

    if (taken) return new FileNameAlreadyExistsError(name);

    return this.ctx.repositories.file.insert({
      id: crypto.randomUUID(),
      connectionId,
      name,
      type,
      content
    });
  }

  private async update(
    id: string,
    input: SaveFileInput
  ): Promise<File | FileNotFoundError | FileNameAlreadyExistsError> {
    const { connectionId, name, content } = input;
    const existing = await this.ctx.repositories.file.findOne({ id, connectionId });

    if (!existing) return new FileNotFoundError(id);

    const taken = await this.ctx.repositories.file.findOne({
      connectionId,
      type: existing.type,
      name
    });

    if (taken && taken.id !== id) return new FileNameAlreadyExistsError(name);

    const [updated] = await this.ctx.repositories.file.update({ id }, { name, content });

    if (!updated) return new FileNotFoundError(id);

    return updated;
  }
}
