import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';

import type { Database } from '@/persistence/database';
import * as schema from '@/persistence/schema';
import { config } from '@/shared/config';

export const createAuth = (adminDb: Database) =>
  betterAuth({
    baseURL: config.BETTER_AUTH_URL,
    secret: config.BETTER_AUTH_SECRET,
    trustedOrigins: [config.WEB_URL],
    database: drizzleAdapter(adminDb, { provider: 'pg', schema }),
    session: {
      expiresIn: 60 * 60 * 24 * 30,
      updateAge: 60 * 60 * 24
    },
    advanced: {
      database: { generateId: () => crypto.randomUUID() },
      useSecureCookies: config.NODE_ENV !== 'development',
      defaultCookieAttributes: { sameSite: 'lax' }
    }
  });

export type Auth = ReturnType<typeof createAuth>;
