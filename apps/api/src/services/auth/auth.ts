import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { APIError } from 'better-auth/api';
import { magicLink } from 'better-auth/plugins/magic-link';

import { config } from '@/config';
import { MagicLinkLimitExceededError } from '@/errors/magic-link-errors';
import type { Database } from '@/persistence/database';
import { VerificationRepository } from '@/persistence/repositories/verification-repository';
import * as schema from '@/persistence/schema';
import { getEmailSender } from '@/services/emails/senders/email-sender';
import { resolveLocale } from '@/shared/utils/locale';
import {
  MAGIC_LINK_LIMIT,
  MAGIC_LINK_LIMIT_WINDOW_IN_MINUTES,
  MagicLinkUseCase
} from '@/use-cases/magic-link-use-case';

const MAGIC_LINK_EXPIRES_IN_SECONDS = 15 * 60;
const EMAIL_FROM_NAME = 'dbiewer';

export const createAuth = (adminDb: Database) => {
  const magicLinkUseCase = new MagicLinkUseCase(
    new VerificationRepository(adminDb),
    getEmailSender(config.emailSender),
    { email: config.emailSender.from, name: EMAIL_FROM_NAME }
  );

  return betterAuth({
    baseURL: config.auth.url,
    secret: config.auth.secret,
    trustedOrigins: [config.webUrl],
    database: drizzleAdapter(adminDb, { provider: 'pg', schema }),
    session: {
      expiresIn: 60 * 60 * 24 * 30,
      updateAge: 60 * 60 * 24
    },
    rateLimit: {
      enabled: config.env !== 'test',
      customRules: {
        '/sign-in/magic-link': {
          window: MAGIC_LINK_LIMIT_WINDOW_IN_MINUTES * 60,
          max: MAGIC_LINK_LIMIT
        }
      }
    },
    plugins: [
      magicLink({
        expiresIn: MAGIC_LINK_EXPIRES_IN_SECONDS,
        sendMagicLink: async ({ email, url, token }, ctx) => {
          try {
            await magicLinkUseCase.send({
              email,
              url,
              token,
              locale: resolveLocale(ctx?.headers?.get('accept-language') ?? null)
            });
          } catch (error) {
            if (error instanceof MagicLinkLimitExceededError) {
              throw new APIError('TOO_MANY_REQUESTS', {
                code: 'MAGIC_LINK_LIMIT_EXCEEDED',
                message: 'Too many magic links requested. Please try again later.'
              });
            }

            throw error;
          }
        }
      })
    ],
    advanced: {
      database: { generateId: () => crypto.randomUUID() },
      useSecureCookies: config.env !== 'development',
      defaultCookieAttributes: { sameSite: 'lax' }
    }
  });
};

export type Auth = ReturnType<typeof createAuth>;
