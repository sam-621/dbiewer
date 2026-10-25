import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { type QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { i18n } from '@/shared/i18n/i18n';

type Props = {
  queryClient: QueryClient;
  children: ReactNode;
};

export const Providers = ({ queryClient, children }: Props) => (
  <QueryClientProvider client={queryClient}>
    <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
  </QueryClientProvider>
);
