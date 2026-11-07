import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';

import { config } from '@/config';
import type { AppContext } from '@/context';
import * as schema from '@/persistence/schema';

export const createAuth = (appContext: AppContext) =>
  betterAuth({
    baseURL: config.auth.url,
    secret: config.auth.secret,
    trustedOrigins: [config.webUrl],
    database: drizzleAdapter(appContext.databases.admin, { provider: 'pg', schema }),
    socialProviders: {
      github: config.auth.github
    },
    session: {
      expiresIn: 60 * 60 * 24 * 30,
      updateAge: 60 * 60 * 24
    },
    rateLimit: {
      enabled: config.env !== 'test'
    },
    advanced: {
      database: { generateId: () => crypto.randomUUID() },
      useSecureCookies: config.env !== 'development',
      defaultCookieAttributes: { sameSite: 'lax' }
    }
  });

export type Auth = ReturnType<typeof createAuth>;
