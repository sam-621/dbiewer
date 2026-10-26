import type { UserErrorCode } from '@/api/codegen';
import { BusinessError } from '@/shared/errors/business-error';

export class UserNameRequiredError extends BusinessError<UserErrorCode> {
  constructor(userId: string) {
    super('USER_NAME_REQUIRED', `Name is required for user ${userId}`);
  }
}

export class UserNameTooLongError extends BusinessError<UserErrorCode> {
  constructor(userId: string, length: number, maxLength: number) {
    super(
      'USER_NAME_TOO_LONG',
      `Name of user ${userId} has ${length} characters and exceeds ${maxLength}`
    );
  }
}
