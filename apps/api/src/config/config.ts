import { z } from 'zod';

const ConfigSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().nonnegative().default(4000),
    DATABASE_URL: z.url(),
    ADMIN_DATABASE_URL: z.url(),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.url(),
    WEB_URL: z.url(),
    EMAIL_SENDER: z.enum(['resend', 'console', 'dummy']).default('console'),
    RESEND_API_KEY: z.string().min(1).optional(),
    EMAIL_FROM: z.email().optional()
  })
  .superRefine((value, ctx) => {
    if (value.NODE_ENV === 'production' && value.EMAIL_SENDER !== 'resend') {
      ctx.addIssue({
        code: 'custom',
        path: ['EMAIL_SENDER'],
        message: 'EMAIL_SENDER must be resend in production'
      });
    }

    if (value.EMAIL_SENDER !== 'resend') return;

    for (const key of ['RESEND_API_KEY', 'EMAIL_FROM'] as const) {
      if (!value[key]) {
        ctx.addIssue({
          code: 'custom',
          path: [key],
          message: `${key} is required when EMAIL_SENDER is resend`
        });
      }
    }
  });

export type Config = z.infer<typeof ConfigSchema>;

export const config: Config = ConfigSchema.parse(process.env);
