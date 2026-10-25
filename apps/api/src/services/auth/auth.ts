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
const LOCAL_EMAIL_FROM = 'no-reply@dbiewer.localhost';

export const createAuth = (adminDb: Database) => {
  const magicLinkUseCase = new MagicLinkUseCase(
    new VerificationRepository(adminDb),
    getEmailSender(config),
    { email: config.EMAIL_FROM ?? LOCAL_EMAIL_FROM, name: EMAIL_FROM_NAME }
  );

  return betterAuth({
    baseURL: config.BETTER_AUTH_URL,
    secret: config.BETTER_AUTH_SECRET,
    trustedOrigins: [config.WEB_URL],
    database: drizzleAdapter(adminDb, { provider: 'pg', schema }),
    session: {
      expiresIn: 60 * 60 * 24 * 30,
      updateAge: 60 * 60 * 24
    },
    rateLimit: {
      enabled: config.NODE_ENV !== 'test',
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
      useSecureCookies: config.NODE_ENV !== 'development',
      defaultCookieAttributes: { sameSite: 'lax' }
    }
  });
};

export type Auth = ReturnType<typeof createAuth>;
