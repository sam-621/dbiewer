import { Route, Routes } from 'react-router';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { authClient } from '@/lib/api/auth-client';
import { gqlFetcher } from '@/lib/api/fetcher';
import { Protect } from '@/shared/guards/protect';

import { render } from '../../../../tests/render';

import { WorkspacePage } from './workspace-page';

vi.mock('@/lib/api/fetcher');
vi.mock('@/lib/api/auth-client', () => ({
  authClient: { signOut: vi.fn() }
}));

const ME = {
  user: { id: 'user-1', name: 'Ana', email: 'ana@acme.dev', image: null },
  workspace: { id: 'workspace-1', name: "Ana's workspace" }
};

const signOut = vi.mocked(authClient.signOut);

const renderPage = () =>
  render(
    <Routes>
      <Route path="/login" element={<p>Login</p>} />
      <Route element={<Protect />}>
        <Route path="/" element={<WorkspacePage />} />
      </Route>
    </Routes>
  );

describe('WorkspacePage', () => {
  beforeEach(() => {
    vi.mocked(gqlFetcher).mockReset();
    vi.mocked(gqlFetcher).mockResolvedValue({ me: ME });
    signOut.mockReset();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  test('renders the workspace name', async () => {
    renderPage();

    expect(await screen.findByRole('heading', { name: "Ana's workspace" })).toBeInTheDocument();
  });

  test('signs out and redirects to login', async () => {
    signOut.mockImplementation(async () => {
      vi.mocked(gqlFetcher).mockResolvedValue({ me: null });
      return { data: { success: true }, error: null };
    });

    renderPage();
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Cerrar sesión' }));

    expect(await screen.findByText('Login')).toBeInTheDocument();
    expect(signOut).toHaveBeenCalled();
  });

  test('shows a generic error when sign out fails', async () => {
    signOut.mockRejectedValue(new Error('Network error'));

    renderPage();
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Cerrar sesión' }));

    expect(await screen.findByText('Algo salió mal')).toBeInTheDocument();
    expect(screen.queryByText('Login')).not.toBeInTheDocument();
  });
});
