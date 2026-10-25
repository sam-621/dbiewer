import { beforeEach, describe, expect, test, vi } from 'vitest';

import { MagicLinkLimitExceededError } from '@/errors/magic-link-errors';
import type { VerificationRepository } from '@/persistence/repositories/verification-repository';
import type { EmailSender } from '@/services/emails/senders/email-sender';

import { MagicLinkUseCase } from './magic-link-use-case';

const input = {
  email: 'ada@example.com',
  url: 'http://localhost:4000/api/auth/magic-link/verify?token=token-1',
  token: 'token-1',
  locale: 'es' as const
};

const emailFrom = { email: 'no-reply@dbiewer.com', name: 'dbiewer' };

describe('MagicLinkUseCase.send', () => {
  const countMagicLinksSince = vi.fn<VerificationRepository['countMagicLinksSince']>();
  const removeMagicLink = vi.fn<VerificationRepository['removeMagicLink']>();
  const send = vi.fn<EmailSender['send']>();

  const useCase = new MagicLinkUseCase(
    { countMagicLinksSince, removeMagicLink } as unknown as VerificationRepository,
    { send },
    emailFrom
  );

  beforeEach(() => {
    vi.resetAllMocks();
  });

  test('sends the magic link in the requested locale', async () => {
    countMagicLinksSince.mockResolvedValue(1);

    await useCase.send(input);

    expect(send).toHaveBeenCalledWith({
      from: emailFrom,
      to: input.email,
      subject: 'Tu link para entrar a dbiewer',
      html: expect.stringContaining('Entrar a dbiewer'),
      text: expect.stringContaining(input.url)
    });
    expect(removeMagicLink).not.toHaveBeenCalled();
  });

  test('sends the magic link url in the email body', async () => {
    countMagicLinksSince.mockResolvedValue(1);

    await useCase.send(input);

    expect(send.mock.calls[0]?.[0].html).toContain(`href="${input.url}"`);
  });

  test('sends the third magic link of the window', async () => {
    countMagicLinksSince.mockResolvedValue(3);

    await useCase.send(input);

    expect(send).toHaveBeenCalledOnce();
  });

  test('counts the magic links of the last 10 minutes', async () => {
    vi.useFakeTimers({ now: new Date('2026-10-25T12:00:00Z') });
    countMagicLinksSince.mockResolvedValue(1);

    await useCase.send(input);

    expect(countMagicLinksSince).toHaveBeenCalledWith(
      input.email,
      new Date('2026-10-25T11:50:00Z')
    );
    vi.useRealTimers();
  });

  test('does not send a fourth magic link within the window', async () => {
    countMagicLinksSince.mockResolvedValue(4);

    await expect(useCase.send(input)).rejects.toBeInstanceOf(MagicLinkLimitExceededError);

    expect(send).not.toHaveBeenCalled();
  });

  test('removes the rejected magic link so it does not count', async () => {
    countMagicLinksSince.mockResolvedValue(4);

    await expect(useCase.send(input)).rejects.toThrow(MagicLinkLimitExceededError);

    expect(removeMagicLink).toHaveBeenCalledWith(input.token);
  });
});
