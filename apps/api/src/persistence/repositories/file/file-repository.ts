import type { Transaction } from '@/persistence/database';
import { Repository } from '@/persistence/repositories/repository';
import type { RepositoryRLS } from '@/persistence/rls';
import { file } from '@/persistence/schema';

export type File = typeof file.$inferSelect;

export class FileRepository extends Repository<typeof file> {
  constructor(
    trx: Transaction,
    private readonly rls: RepositoryRLS
  ) {
    super(trx, file);
  }
}
