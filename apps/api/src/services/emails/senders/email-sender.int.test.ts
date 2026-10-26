import { describe, expect, test } from 'vitest';

import { ConsoleSender } from './console';
import { DummySender } from './dummy';
import { getEmailSender } from './email-sender';
import { ResendSender } from './resend';

const from = 'no-reply@dbiewer.com';

describe('getEmailSender', () => {
  test('returns the resend sender', () => {
    const sender = getEmailSender({
      adapter: 'resend',
      from,
      resend: { apiKey: 'resend-api-key' }
    });

    expect(sender).toBeInstanceOf(ResendSender);
  });

  test('returns the console sender', () => {
    const sender = getEmailSender({ adapter: 'console', from, resend: { apiKey: undefined } });

    expect(sender).toBeInstanceOf(ConsoleSender);
  });

  test('returns the dummy sender', () => {
    const sender = getEmailSender({ adapter: 'dummy', from, resend: { apiKey: undefined } });

    expect(sender).toBeInstanceOf(DummySender);
  });

  test('throws when resend has no api key', () => {
    expect(() =>
      getEmailSender({ adapter: 'resend', from, resend: { apiKey: undefined } })
    ).toThrow('RESEND_API_KEY is required when EMAIL_SENDER is resend');
  });
});
