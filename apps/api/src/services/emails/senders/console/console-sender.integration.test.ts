import { describe, expect, test, vi } from 'vitest';

import type { Logger } from '@/services/logger';

import { ConsoleSender } from './console-sender';

describe('ConsoleSender', () => {
  test('writes the subject, recipient and text of the email to the log', async () => {
    const info = vi.fn();

    await new ConsoleSender({ info } as unknown as Logger).send({
      from: { email: 'no-reply@dbiewer.com', name: 'dbiewer' },
      to: 'ada@example.com',
      subject: 'Sign in to dbiewer',
      html: '<p>Sign in</p>',
      text: 'Sign in: http://localhost:4000/verify'
    });

    expect(info).toHaveBeenCalledWith(
      'Email "Sign in to dbiewer" sent to ada@example.com\n\nSign in: http://localhost:4000/verify'
    );
  });
});
