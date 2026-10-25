import { beforeEach, describe, expect, test, vi } from 'vitest';

import { EmailSendFailedError } from '@/errors/email-errors';

import { ResendSender } from './resend-sender';

const { Resend, send } = vi.hoisted(() => {
  const send = vi.fn();
  const Resend = vi.fn(function () {
    return { emails: { send } };
  });

  return { Resend, send };
});

vi.mock('resend', () => ({ Resend }));

const email = {
  from: { email: 'no-reply@dbiewer.com', name: 'dbiewer' },
  to: 'ada@example.com',
  subject: 'Sign in to dbiewer',
  html: '<p>Sign in</p>',
  text: 'Sign in'
};

describe('ResendSender', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('sends the email through resend', async () => {
    send.mockResolvedValue({ data: { id: 'email-1' }, error: null });

    await new ResendSender('resend-api-key').send(email);

    expect(Resend).toHaveBeenCalledWith('resend-api-key');
    expect(send).toHaveBeenCalledWith({
      from: 'dbiewer <no-reply@dbiewer.com>',
      to: ['ada@example.com'],
      subject: email.subject,
      html: email.html,
      text: email.text
    });
  });

  test('throws when resend returns an error', async () => {
    send.mockResolvedValue({ data: null, error: { message: 'Invalid API key' } });

    await expect(new ResendSender('resend-api-key').send(email)).rejects.toThrow(
      new EmailSendFailedError(email.to, 'Invalid API key')
    );
  });
});
