import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { authClient } from '@/lib/api/auth-client';

import { render } from '../../../../tests/render';

import { LoginPage } from './login-page';

vi.mock('@/lib/api/auth-client', () => ({
  authClient: { signIn: { magicLink: vi.fn() } }
}));

const magicLink = vi.mocked(authClient.signIn.magicLink);

const requestLink = async (email = 'ana@acme.dev') => {
  const user = userEvent.setup();

  await user.type(screen.getByLabelText('Correo'), email);
  await user.click(screen.getByRole('button', { name: 'Enviar magic link' }));

  return user;
};

describe('LoginPage', () => {
  beforeEach(() => {
    magicLink.mockReset();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  test('renders the sign in form', () => {
    render(<LoginPage />);

    expect(screen.getByRole('heading', { name: 'Entra a dbiewer' })).toBeInTheDocument();
  });

  test('sends the magic link and shows the sent state', async () => {
    magicLink.mockResolvedValue({ data: { status: true }, error: null });

    render(<LoginPage />);
    await requestLink();

    expect(await screen.findByRole('heading', { name: 'Revisa tu correo' })).toBeInTheDocument();
    expect(
      screen.getByText('Enviamos un magic link a ana@acme.dev. Vence en 15 minutos.')
    ).toBeInTheDocument();
    expect(magicLink).toHaveBeenCalledWith({
      email: 'ana@acme.dev',
      callbackURL: `${window.location.origin}/`,
      errorCallbackURL: `${window.location.origin}/login`
    });
  });

  test('shows a validation error for an invalid email', async () => {
    render(<LoginPage />);
    await requestLink('ana');

    expect(await screen.findByText('Ingresa un correo válido')).toBeInTheDocument();
    expect(magicLink).not.toHaveBeenCalled();
  });

  test('shows a warning when there are too many attempts', async () => {
    magicLink.mockResolvedValue({
      data: null,
      error: { status: 429, statusText: 'Too Many Requests' }
    });

    render(<LoginPage />);
    await requestLink();

    expect(
      await screen.findByText('Demasiados intentos. Espera unos minutos antes de pedir otro link.')
    ).toBeInTheDocument();
  });

  test('shows a generic error when the request fails', async () => {
    magicLink.mockRejectedValue(new Error('Network error'));

    render(<LoginPage />);
    await requestLink();

    expect(await screen.findByText('Algo salió mal')).toBeInTheDocument();
  });

  test('shows a notice when the link expired', () => {
    render(<LoginPage />, { route: '/login?error=INVALID_TOKEN' });

    expect(screen.getByText('Este link venció. Pide uno nuevo.')).toBeInTheDocument();
  });

  test('resends the link from the sent state', async () => {
    magicLink.mockResolvedValue({ data: { status: true }, error: null });

    render(<LoginPage />);
    const user = await requestLink();
    await user.click(await screen.findByRole('button', { name: 'Reenviar link' }));

    expect(await screen.findByText('Te enviamos un link nuevo.')).toBeInTheDocument();
    expect(magicLink).toHaveBeenCalledTimes(2);
  });

  test('goes back to the form to use another email', async () => {
    magicLink.mockResolvedValue({ data: { status: true }, error: null });

    render(<LoginPage />);
    const user = await requestLink();
    await user.click(await screen.findByRole('button', { name: 'Usar otro correo' }));

    expect(screen.getByRole('heading', { name: 'Entra a dbiewer' })).toBeInTheDocument();
  });
});
