import { Route, Routes } from 'react-router';
import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { gqlFetcher } from '@/lib/api/fetcher';

import { render } from '../../../tests/render';

import { Public } from './public';

vi.mock('@/lib/api/fetcher');

const ME = {
  user: { id: 'user-1', name: 'Ana', email: 'ana@acme.dev', image: null },
  workspace: { id: 'workspace-1', name: "Ana's workspace" }
};

const renderGuard = () =>
  render(
    <Routes>
      <Route path="/" element={<p>Workspace</p>} />
      <Route path="/login" element={<p>Login</p>} />
      <Route element={<Public />}>
        <Route path="/guarded" element={<p>Guarded</p>} />
      </Route>
    </Routes>,
    { route: '/guarded' }
  );

describe('Public', () => {
  beforeEach(() => {
    vi.mocked(gqlFetcher).mockReset();
  });

  test('shows a loading state while the session is resolving', () => {
    vi.mocked(gqlFetcher).mockReturnValue(new Promise(() => {}));

    renderGuard();

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByText('Guarded')).not.toBeInTheDocument();
  });

  test('renders the route when there is no session', async () => {
    vi.mocked(gqlFetcher).mockResolvedValue({ me: null });

    renderGuard();

    expect(await screen.findByText('Guarded')).toBeInTheDocument();
  });

  test('redirects to the workspace when there is a session', async () => {
    vi.mocked(gqlFetcher).mockResolvedValue({ me: ME });

    renderGuard();

    expect(await screen.findByText('Workspace')).toBeInTheDocument();
    expect(screen.queryByText('Guarded')).not.toBeInTheDocument();
  });
});
