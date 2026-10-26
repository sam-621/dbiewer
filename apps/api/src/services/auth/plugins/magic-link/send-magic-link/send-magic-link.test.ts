import { beforeEach, describe, expect, test, vi } from 'vitest';

import type { EmailSender } from '@/services/emails/senders/email-sender';

import { sendMagicLink } from './send-magic-link';

const { EMAIL_FROM } = vi.hoisted(() => ({ EMAIL_FROM: 'no-reply@dbiewer.com' }));

vi.mock('@/config', () => ({ config: { emailSender: { from: EMAIL_FROM } } }));

const input = {
  email: 'ada@example.com',
  url: 'http://localhost:4000/api/auth/magic-link/verify?token=token-1'
};

describe('sendMagicLink', () => {
  const send = vi.fn<EmailSender['send']>();
  const emailSender: EmailSender = { send };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  test('sends the magic link email to the user in spanish', async () => {
    await sendMagicLink(emailSender, { ...input, locale: 'es' });

    expect(send).toHaveBeenCalledWith({
      from: { email: EMAIL_FROM, name: 'dbiewer' },
      to: input.email,
      subject: 'Tu link para entrar a dbiewer',
      html: expect.stringContaining(input.url),
      text: expect.stringContaining(input.url)
    });
  });

  test('sends the magic link email to the user in english', async () => {
    await sendMagicLink(emailSender, { ...input, locale: 'en' });

    expect(send).toHaveBeenCalledWith({
      from: { email: EMAIL_FROM, name: 'dbiewer' },
      to: input.email,
      subject: 'Your dbiewer sign-in link',
      html: expect.stringContaining(input.url),
      text: expect.stringContaining(input.url)
    });
  });
});
