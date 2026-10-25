import { MagicLinkLimitExceededError } from '@/errors/magic-link-errors';
import type { MagicLinkRequestRepository } from '@/persistence/repositories/magic-link-request';
import type { VerificationRepository } from '@/persistence/repositories/verification';
import { EmailSubjects } from '@/services/emails/locales/email-subjects';
import type { EmailAddress, EmailSender } from '@/services/emails/senders/email-sender';
import { createMagicLinkEmail } from '@/services/emails/templates/magic-link-template';
import type { Locale } from '@/shared/utils/locale';

export const MAGIC_LINK_LIMIT = 3;
export const MAGIC_LINK_LIMIT_WINDOW_IN_MINUTES = 10;

export type SendMagicLinkInput = {
  email: string;
  url: string;
  token: string;
  locale: Locale;
};

export class MagicLinkUseCase {
  constructor(
    private readonly magicLinkRequestRepository: MagicLinkRequestRepository,
    private readonly verificationRepository: VerificationRepository,
    private readonly emailSender: EmailSender,
    private readonly emailFrom: EmailAddress
  ) {}

  async send(input: SendMagicLinkInput) {
    await this.magicLinkRequestRepository.create(input.email);

    const since = new Date(Date.now() - MAGIC_LINK_LIMIT_WINDOW_IN_MINUTES * 60 * 1000);
    const requested = await this.magicLinkRequestRepository.countSince(input.email, since);

    if (requested > MAGIC_LINK_LIMIT) {
      await this.verificationRepository.removeMagicLink(input.token);
      throw new MagicLinkLimitExceededError(
        input.email,
        MAGIC_LINK_LIMIT,
        MAGIC_LINK_LIMIT_WINDOW_IN_MINUTES
      );
    }

    const { html, text } = await createMagicLinkEmail({ url: input.url, locale: input.locale });

    await this.emailSender.send({
      from: this.emailFrom,
      to: input.email,
      subject: EmailSubjects[input.locale].magicLink,
      html,
      text
    });
  }
}
