import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { APIError } from 'better-auth/api';
import { magicLink } from 'better-auth/plugins/magic-link';

import { config } from '@/config';
import type { AppContext } from '@/context';
import { MagicLinkLimitExceededError } from '@/errors/magic-link-errors';
import * as schema from '@/persistence/schema';
import { resolveLocale } from '@/shared/utils/locale';
import {
  MAGIC_LINK_LIMIT,
  MAGIC_LINK_LIMIT_WINDOW_IN_MINUTES,
  MagicLinkUseCase
} from '@/use-cases/magic-link-use-case';

const MAGIC_LINK_EXPIRES_IN_SECONDS = 15 * 60;
const EMAIL_FROM_NAME = 'dbiewer';

export const createAuth = (appContext: AppContext) =>
  betterAuth({
    baseURL: config.auth.url,
    secret: config.auth.secret,
    trustedOrigins: [config.webUrl],
    database: drizzleAdapter(appContext.databases.admin, { provider: 'pg', schema }),
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
          const magicLinkUseCase = new MagicLinkUseCase(
            appContext.repositories.verification,
            appContext.services.emailSender,
            { email: config.emailSender.from, name: EMAIL_FROM_NAME }
          );

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

export type Auth = ReturnType<typeof createAuth>;
