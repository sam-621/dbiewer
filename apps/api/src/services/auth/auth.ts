import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';

import { config } from '@/config';
import type { AppContext } from '@/context';
import * as schema from '@/persistence/schema';

import { authMagicLinkPlugin } from './plugins/magic-link';

const MAGIC_LINK_RATE_LIMIT_MAX = 3;
const MAGIC_LINK_RATE_LIMIT_WINDOW_IN_SECONDS = 10 * 60;

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
          window: MAGIC_LINK_RATE_LIMIT_WINDOW_IN_SECONDS,
          max: MAGIC_LINK_RATE_LIMIT_MAX
        }
      }
    },
    plugins: [authMagicLinkPlugin(appContext)],
    advanced: {
      database: { generateId: () => crypto.randomUUID() },
      useSecureCookies: config.env !== 'development',
      defaultCookieAttributes: { sameSite: 'lax' }
    }
  });

export type Auth = ReturnType<typeof createAuth>;
