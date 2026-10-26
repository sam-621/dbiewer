import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';

import { Schema } from './form-schema';

export type FormValues = z.infer<typeof Schema>;

export const useLoginForm = () =>
  useForm<FormValues>({
    resolver: zodResolver(Schema),
    defaultValues: { email: '' }
  });
