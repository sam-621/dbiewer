import { z } from 'zod';

export const Schema = z.object({
  email: z.email('Enter a valid email')
});
