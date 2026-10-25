import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';

import { App } from '@/app/app';
import { ErrorBoundary } from '@/app/error-boundary';
import { Providers } from '@/app/providers';
import { createQueryClient } from '@/app/query-client';

import '@/app/app.css';

const root = document.getElementById('root');

if (root) {
  createRoot(root).render(
    <StrictMode>
      <Providers queryClient={createQueryClient()}>
        <ErrorBoundary>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </ErrorBoundary>
      </Providers>
    </StrictMode>
  );
}
