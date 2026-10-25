import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { EmailSendFailedError } from '@/errors/email-errors';
import { MagicLinkLimitExceededError } from '@/errors/magic-link-errors';
import type { MagicLinkRequestRepository } from '@/persistence/repositories/magic-link-request';
import type { VerificationRepository } from '@/persistence/repositories/verification';
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
  const countSince = vi.fn<MagicLinkRequestRepository['countSince']>();
  const create = vi.fn<MagicLinkRequestRepository['create']>();
  const removeMagicLink = vi.fn<VerificationRepository['removeMagicLink']>();
  const send = vi.fn<EmailSender['send']>();

  const useCase = new MagicLinkUseCase(
    { countSince, create } as unknown as MagicLinkRequestRepository,
    { removeMagicLink } as unknown as VerificationRepository,
    { send },
    emailFrom
  );

  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('sends the magic link in the requested locale', async () => {
    countSince.mockResolvedValue(1);

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
    countSince.mockResolvedValue(1);

    await useCase.send(input);

    expect(send.mock.calls[0]?.[0].html).toContain(`href="${input.url}"`);
  });

  test('adds the request before counting and sending', async () => {
    countSince.mockResolvedValue(1);

    await useCase.send(input);

    expect(create).toHaveBeenCalledWith(input.email);
    expect(create.mock.invocationCallOrder[0]).toBeLessThan(
      countSince.mock.invocationCallOrder[0] ?? 0
    );
    expect(create.mock.invocationCallOrder[0]).toBeLessThan(send.mock.invocationCallOrder[0] ?? 0);
  });

  test('sends the third magic link of the window', async () => {
    countSince.mockResolvedValue(3);

    await useCase.send(input);

    expect(send).toHaveBeenCalledOnce();
  });

  test('counts the magic links of the last 10 minutes', async () => {
    vi.useFakeTimers({ now: new Date('2026-10-25T12:00:00Z') });
    countSince.mockResolvedValue(1);

    await useCase.send(input);

    expect(countSince).toHaveBeenCalledWith(input.email, new Date('2026-10-25T11:50:00Z'));
  });

  test('keeps the request when the email fails to send', async () => {
    countSince.mockResolvedValue(1);
    send.mockRejectedValue(new EmailSendFailedError(input.email, 'provider down'));

    await expect(useCase.send(input)).rejects.toThrow(EmailSendFailedError);

    expect(create).toHaveBeenCalledWith(input.email);
  });

  test('does not send a fourth magic link within the window', async () => {
    countSince.mockResolvedValue(4);

    await expect(useCase.send(input)).rejects.toBeInstanceOf(MagicLinkLimitExceededError);

    expect(send).not.toHaveBeenCalled();
  });

  test('adds the rejected request too', async () => {
    countSince.mockResolvedValue(4);

    await expect(useCase.send(input)).rejects.toThrow(MagicLinkLimitExceededError);

    expect(create).toHaveBeenCalledWith(input.email);
  });

  test('removes the magic link of the rejected request', async () => {
    countSince.mockResolvedValue(4);

    await expect(useCase.send(input)).rejects.toThrow(MagicLinkLimitExceededError);

    expect(removeMagicLink).toHaveBeenCalledWith(input.token);
  });
});
