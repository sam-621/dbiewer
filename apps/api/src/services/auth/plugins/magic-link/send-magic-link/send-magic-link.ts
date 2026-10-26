import { config } from '@/config';
import { EmailSubjects } from '@/services/emails/locales/email-subjects';
import type { EmailSender } from '@/services/emails/senders/email-sender';
import { createMagicLinkEmail } from '@/services/emails/templates/magic-link-template';
import type { Locale } from '@/shared/utils/locale';

const EMAIL_FROM_NAME = 'dbiewer';

type SendMagicLinkInput = {
  email: string;
  url: string;
  locale: Locale;
};

export const sendMagicLink = async (emailSender: EmailSender, input: SendMagicLinkInput) => {
  const { html, text } = await createMagicLinkEmail({ url: input.url, locale: input.locale });

  await emailSender.send({
    from: { email: config.emailSender.from, name: EMAIL_FROM_NAME },
    to: input.email,
    subject: EmailSubjects[input.locale].magicLink,
    html,
    text
  });
};
