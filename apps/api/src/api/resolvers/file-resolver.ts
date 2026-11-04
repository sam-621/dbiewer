import type {
  MutationRemoveFileArgs,
  MutationSaveFileArgs,
  QueryFileArgs,
  QueryFilesArgs,
  Resolvers
} from '@/api/codegen';
import type { SessionContext } from '@/api/middlewares/require-session';
import { requireSession } from '@/api/middlewares/require-session';
import { apiResponse } from '@/api/utils/api-response';
import { FileRemover } from '@/modules/file/use-cases/file-remover';
import { FileSaver } from '@/modules/file/use-cases/file-saver';
import { OrderByKey } from '@/persistence/repositories/repository';
import { UnitOfWork } from '@/persistence/unit-of-work';

async function files(_parent: unknown, args: QueryFilesArgs, ctx: SessionContext) {
  const uow = new UnitOfWork(ctx.database, ctx.rlsContext);

  const items = await uow.execute(repositories =>
    repositories.file.findMany({
      where: { connectionId: args.connectionId },
      orderBy: { updatedAt: OrderByKey.Desc, id: OrderByKey.Asc }
    })
  );

  return { items };
}

async function file(_parent: unknown, args: QueryFileArgs, ctx: SessionContext) {
  const uow = new UnitOfWork(ctx.database, ctx.rlsContext);

  return uow.execute(repositories => repositories.file.findOne({ where: { id: args.id } }));
}

async function saveFile(_parent: unknown, args: MutationSaveFileArgs, ctx: SessionContext) {
  const uow = new UnitOfWork(ctx.database, ctx.rlsContext);

  const result = await uow.execute(async (_repositories, uowCtx) => {
    const fileSaver = new FileSaver(uowCtx);

    return fileSaver.execute(args.input);
  });

  return apiResponse(result, 'file');
}

async function removeFile(_parent: unknown, args: MutationRemoveFileArgs, ctx: SessionContext) {
  const uow = new UnitOfWork(ctx.database, ctx.rlsContext);

  const result = await uow.execute(async (_repositories, uowCtx) => {
    const fileRemover = new FileRemover(uowCtx);

    return fileRemover.execute(args.id);
  });

  return apiResponse(result, 'success');
}

export const FileResolver: Resolvers = {
  FileType: {
    SQL: 'sql',
    TXT: 'txt'
  },
  Query: {
    files: requireSession(files),
    file: requireSession(file)
  },
  Mutation: {
    saveFile: requireSession(saveFile),
    removeFile: requireSession(removeFile)
  }
};
