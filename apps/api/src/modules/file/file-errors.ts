import type { FileErrorCode } from '@/api/codegen';
import { BusinessError } from '@/shared/errors/business-error';

export class FileNameAlreadyExistsError extends BusinessError<FileErrorCode> {
  constructor(name: string) {
    super('FILE_NAME_ALREADY_EXISTS', `File name ${name} already exists`);
  }
}

export class FileNotFoundError extends BusinessError<FileErrorCode> {
  constructor(id: string) {
    super('FILE_NOT_FOUND', `File not found with id ${id}`);
  }
}
