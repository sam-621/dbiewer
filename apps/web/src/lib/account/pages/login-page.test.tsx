import { useLocation } from 'react-router';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { authClient } from '@/lib/api/auth-client';

import { render } from '../../../../tests/render';

import { LoginPage } from './login-page';

vi.mock('@/lib/api/auth-client', () => ({
  authClient: { signIn: { social: vi.fn() } }
}));

const social = vi.mocked(authClient.signIn.social);

const LocationSearch = () => <output data-testid="location-search">{useLocation().search}</output>;

const continueWithGithub = () =>
  userEvent.setup().click(screen.getByRole('button', { name: 'Continuar con GitHub' }));

describe('LoginPage', () => {
  beforeEach(() => {
    social.mockReset();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  test('renders the sign in page', () => {
    render(<LoginPage />);

    expect(screen.getByRole('heading', { name: 'Entra a dbiewer' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continuar con GitHub' })).toBeInTheDocument();
  });

  test('signs in with GitHub', async () => {
    social.mockResolvedValue({ data: { url: 'https://github.com', redirect: true }, error: null });

    render(<LoginPage />);
    await continueWithGithub();

    expect(social).toHaveBeenCalledWith({
      provider: 'github',
      callbackURL: `${window.location.origin}/`,
      errorCallbackURL: `${window.location.origin}/login`
    });
    expect(screen.getByRole('button')).toHaveAttribute('data-loading');
  });

  test('shows a generic error when GitHub sign in fails', async () => {
    social.mockRejectedValue(new Error('Network error'));

    render(<LoginPage />);
    await continueWithGithub();

    expect(await screen.findByText('Algo salió mal')).toBeInTheDocument();
  });

  test('shows an error when GitHub sends back an error', () => {
    render(
      <>
        <LoginPage />
        <LocationSearch />
      </>,
      { route: '/login?error=access_denied' }
    );

    expect(
      screen.getByText('No pudimos iniciar sesión con GitHub. Intenta de nuevo.')
    ).toBeInTheDocument();
    expect(screen.getByTestId('location-search')).toBeEmptyDOMElement();
  });
});
