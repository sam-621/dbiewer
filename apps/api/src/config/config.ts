import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  PORT: z.coerce.number().int().nonnegative(),
  DATABASE_URL: z.url(),
  ADMIN_DATABASE_URL: z.url(),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url(),
  GITHUB_CLIENT_ID: z.string().min(1),
  GITHUB_CLIENT_SECRET: z.string().min(1),
  WEB_URL: z.url(),
  CONNECTIONS_ENCRYPTION_KEY: z
    .base64()
    .refine(
      value => Buffer.from(value, 'base64').length === 32,
      'CONNECTIONS_ENCRYPTION_KEY must decode to 32 bytes'
    )
});

const ConfigSchema = EnvSchema.transform(env => ({
  env: env.NODE_ENV,
  port: env.PORT,
  database: {
    url: env.DATABASE_URL,
    adminUrl: env.ADMIN_DATABASE_URL
  },
  auth: {
    secret: env.BETTER_AUTH_SECRET,
    url: env.BETTER_AUTH_URL,
    github: {
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET
    }
  },
  webUrl: env.WEB_URL,
  encryption: {
    connectionsKey: env.CONNECTIONS_ENCRYPTION_KEY
  },
  postgres: {
    allowPrivateHosts: env.NODE_ENV !== 'production'
  }
}));

export type Config = z.infer<typeof ConfigSchema>;

export type PostgresConfig = Config['postgres'];

export const config: Config = ConfigSchema.parse(process.env);
