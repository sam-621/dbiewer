import { z } from 'zod';

const EnvSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']),
    PORT: z.coerce.number().int().nonnegative(),
    DATABASE_URL: z.url(),
    ADMIN_DATABASE_URL: z.url(),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.url(),
    WEB_URL: z.url(),
    EMAIL_SENDER: z.enum(['resend', 'console', 'dummy']),
    EMAIL_FROM: z.email(),
    RESEND_API_KEY: z.string().min(1).optional(),
    CONNECTIONS_ENCRYPTION_KEY: z
      .base64()
      .refine(
        value => Buffer.from(value, 'base64').length === 32,
        'CONNECTIONS_ENCRYPTION_KEY must decode to 32 bytes'
      )
  })
  .superRefine((env, ctx) => {
    if (env.EMAIL_SENDER === 'resend' && !env.RESEND_API_KEY) {
      ctx.addIssue({
        code: 'custom',
        path: ['RESEND_API_KEY'],
        message: 'RESEND_API_KEY is required when EMAIL_SENDER is resend'
      });
    }
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
    url: env.BETTER_AUTH_URL
  },
  webUrl: env.WEB_URL,
  emailSender: {
    adapter: env.EMAIL_SENDER,
    from: env.EMAIL_FROM,
    resend: {
      apiKey: env.RESEND_API_KEY
    }
  },
  encryption: {
    connectionsKey: env.CONNECTIONS_ENCRYPTION_KEY
  }
}));

export type Config = z.infer<typeof ConfigSchema>;

export type EmailSenderConfig = Config['emailSender'];

export const config: Config = ConfigSchema.parse(process.env);
