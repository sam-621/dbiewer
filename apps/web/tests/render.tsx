import type { ReactElement } from 'react';
import { MemoryRouter } from 'react-router';
import { QueryClient } from '@tanstack/react-query';
import { render as rtlRender } from '@testing-library/react';

import { Providers } from '@/app/providers';

type Options = { route?: string };

export const render = (ui: ReactElement, { route = '/' }: Options = {}) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } }
  });

  return rtlRender(
    <Providers queryClient={queryClient}>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </Providers>
  );
};
