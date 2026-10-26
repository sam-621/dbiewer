import type { SessionUser } from '@/context';
import { UserNameRequiredError, UserNameTooLongError } from '@/modules/user/user-errors';
import type { Auth } from '@/services/auth';

type UpdateUserProfileInput = {
  user: SessionUser;
  headers: Headers;
  name: string;
};

const NAME_MAX_LENGTH = 50;

export class UserProfileUpdater {
  constructor(private readonly auth: Auth) {}

  async execute(
    input: UpdateUserProfileInput
  ): Promise<SessionUser | UserNameRequiredError | UserNameTooLongError> {
    const name = input.name.trim();

    if (!name) return new UserNameRequiredError(input.user.id);
    if (name.length > NAME_MAX_LENGTH) {
      return new UserNameTooLongError(input.user.id, name.length, NAME_MAX_LENGTH);
    }

    await this.auth.api.updateUser({ headers: input.headers, body: { name } });

    return { ...input.user, name };
  }
}
