import z from 'zod';

import { connection } from '@/persistence/schema';

export const CreateConnectionSchema = z.object({
  name: z.string().trim().min(1).max(50),
  host: z.string().trim().min(1),
  port: z.number().int().min(1).max(65535),
  database: z.string().trim().min(1),
  username: z.string().trim().min(1),
  password: z
    .string()
    .nullish()
    .transform(password => password || null),
  sslMode: z.enum(connection.sslMode.enumValues)
});

export const UpdateConnectionSchema = CreateConnectionSchema.extend({
  id: z.string()
});

const NullableTestConnectionSchema = z.object({
  host: z.string().nullish(),
  port: z.number().nullish(),
  database: z.string().nullish(),
  username: z.string().nullish(),
  password: z.string().nullish(),
  sslMode: z.enum(connection.sslMode.enumValues).nullish()
});

export const TestConnectionSchema = NullableTestConnectionSchema.pipe(
  CreateConnectionSchema.omit({ name: true })
);
