import z from 'zod';

export const RunQuerySchema = z.object({
  connectionId: z.string(),
  sql: z.string().trim().min(1).max(100_000)
});
