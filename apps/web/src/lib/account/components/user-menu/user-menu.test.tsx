import { Route, Routes } from 'react-router';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { authClient } from '@/lib/api/auth-client';
import { gqlFetcher } from '@/lib/api/fetcher';
import { Protect } from '@/shared/guards/protect';
import { i18n } from '@/shared/i18n/i18n';

import { render } from '../../../../../tests/render';

import { UserMenu } from './user-menu';

vi.mock('@/lib/api/fetcher');
vi.mock('@/lib/api/auth-client', () => ({
  authClient: { signOut: vi.fn() }
}));

const signOut = vi.mocked(authClient.signOut);

const ME = {
  user: { id: 'user-1', name: 'Ana', email: 'ana@acme.dev', image: null },
  workspace: { id: 'workspace-1', name: "Ana's workspace" }
};

let isSignedIn = true;

const renderMenu = () =>
  render(
    <Routes>
      <Route path="/login" element={<p>Login</p>} />
      <Route element={<Protect />}>
        <Route path="/" element={<UserMenu />} />
      </Route>
    </Routes>
  );

const openMenu = async () => {
  const user = userEvent.setup();
  await user.click(await screen.findByRole('button', { name: 'Abrir el menú de la cuenta' }));

  return user;
};

describe('UserMenu', () => {
  beforeEach(() => {
    isSignedIn = true;
    vi.mocked(gqlFetcher).mockReset();
    vi.mocked(gqlFetcher).mockImplementation(async () => ({ me: isSignedIn ? ME : null }));
    signOut.mockReset();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(async () => {
    localStorage.clear();
    document.documentElement.classList.add('dark');
    await i18n.changeLanguage('es');
  });

  test('renders the user with the current language and theme pressed', async () => {
    renderMenu();

    const trigger = await screen.findByRole('button', { name: 'Abrir el menú de la cuenta' });
    expect(trigger).toHaveTextContent('Ana');
    expect(trigger).toHaveTextContent('ana@acme.dev');

    await openMenu();

    expect(await screen.findByRole('button', { name: 'Español' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getByRole('button', { name: 'Oscuro' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Claro' })).toHaveAttribute('aria-pressed', 'false');
  });

  test('changes the language', async () => {
    renderMenu();
    const user = await openMenu();
    await user.click(await screen.findByRole('button', { name: 'Inglés' }));

    expect(await screen.findByRole('button', { name: 'English' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(localStorage.getItem('language')).toBe('en');
  });

  test('changes the theme', async () => {
    renderMenu();
    const user = await openMenu();
    await user.click(await screen.findByRole('button', { name: 'Claro' }));

    expect(screen.getByRole('button', { name: 'Claro' })).toHaveAttribute('aria-pressed', 'true');
    expect(document.documentElement).not.toHaveClass('dark');
    expect(localStorage.getItem('theme')).toBe('light');
  });

  test('signs out and goes to login', async () => {
    signOut.mockImplementation(async () => {
      isSignedIn = false;
      return { data: { success: true }, error: null };
    });

    renderMenu();
    const user = await openMenu();
    await user.click(await screen.findByRole('menuitem', { name: 'Cerrar sesión' }));

    expect(await screen.findByText('Login')).toBeInTheDocument();
  });

  test('shows an error when signing out fails', async () => {
    signOut.mockResolvedValue({
      data: null,
      error: { status: 500, statusText: 'Internal Server Error' }
    });

    renderMenu();
    const user = await openMenu();
    await user.click(await screen.findByRole('menuitem', { name: 'Cerrar sesión' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Algo salió mal');
    expect(screen.queryByText('Login')).not.toBeInTheDocument();
  });
});
