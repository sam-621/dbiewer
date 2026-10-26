import { Route, Routes } from 'react-router';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { gqlFetcher } from '@/lib/api/fetcher';
import { Onboarding } from '@/shared/guards/onboarding';
import { i18n } from '@/shared/i18n/i18n';

import { render } from '../../../../tests/render';

import { OnboardingPage } from './onboarding-page';

vi.mock('@/lib/api/fetcher');

const USER = { id: 'user-1', name: '', email: 'ana@acme.dev', image: null };
const WORKSPACE = { id: 'workspace-1', name: 'My workspace' };

type Responses = {
  updateUserProfile?: unknown;
  createWorkspace?: Error;
};

const mockApi = ({ updateUserProfile, createWorkspace }: Responses = {}) => {
  let me: { user: typeof USER; workspace: typeof WORKSPACE | null } = {
    user: USER,
    workspace: null
  };

  vi.mocked(gqlFetcher).mockImplementation(async document => {
    const query = document.toString();

    if (query.includes('mutation UpdateUserProfile')) {
      const result = updateUserProfile ?? { apiErrors: [], user: { id: USER.id, name: 'Ana' } };
      return { updateUserProfile: result };
    }

    if (query.includes('mutation CreateWorkspace')) {
      if (createWorkspace instanceof Error) throw createWorkspace;
      me = { ...me, workspace: WORKSPACE };
      return { createWorkspace: { apiErrors: [], workspace: WORKSPACE } };
    }

    return { me };
  });
};

const renderPage = () =>
  render(
    <Routes>
      <Route path="/" element={<p>Workspace</p>} />
      <Route element={<Onboarding />}>
        <Route path="/onboarding" element={<OnboardingPage />} />
      </Route>
    </Routes>,
    { route: '/onboarding' }
  );

const submit = async (name = 'Ana') => {
  const user = userEvent.setup();

  if (name) await user.type(await screen.findByLabelText('¿Cómo quieres que te llamemos?'), name);
  await user.click(await screen.findByRole('button', { name: 'Continuar' }));

  return user;
};

describe('OnboardingPage', () => {
  beforeEach(() => {
    vi.mocked(gqlFetcher).mockReset();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(async () => {
    localStorage.clear();
    document.documentElement.classList.add('dark');
    await i18n.changeLanguage('es');
  });

  test('renders the onboarding form with dark theme by default', async () => {
    mockApi();

    renderPage();

    expect(
      await screen.findByRole('heading', { name: 'Te damos la bienvenida a dbiewer' })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Oscuro' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Español' })).toHaveAttribute('aria-pressed', 'true');
  });

  test('saves the name, creates the workspace and enters the app', async () => {
    mockApi();

    renderPage();
    await submit('  Ana  ');

    expect(await screen.findByText('Workspace')).toBeInTheDocument();
    expect(gqlFetcher).toHaveBeenCalledWith(expect.anything(), { input: { name: 'Ana' } });
    expect(gqlFetcher).toHaveBeenCalledWith(expect.anything(), {
      input: { name: 'My workspace' }
    });
  });

  test('shows a validation error when the name is empty', async () => {
    mockApi();

    renderPage();
    await submit('');

    expect(await screen.findByText('Ingresa tu nombre')).toBeInTheDocument();
    expect(gqlFetcher).toHaveBeenCalledTimes(1);
  });

  test('shows the api error when the profile is not saved', async () => {
    mockApi({
      updateUserProfile: {
        apiErrors: [{ code: 'USER_NAME_TOO_LONG', message: 'Too long' }],
        user: null
      }
    });

    renderPage();
    await submit();

    expect(
      await screen.findByText('El nombre debe tener 50 caracteres o menos')
    ).toBeInTheDocument();
    expect(screen.queryByText('Workspace')).not.toBeInTheDocument();
  });

  test('shows a generic error when the workspace is not created', async () => {
    mockApi({ createWorkspace: new Error('Network error') });

    renderPage();
    await submit();

    expect(await screen.findByText('Algo salió mal')).toBeInTheDocument();
    expect(screen.queryByText('Workspace')).not.toBeInTheDocument();
  });

  test('applies the theme when it changes', async () => {
    mockApi();

    renderPage();
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Claro' }));

    expect(document.documentElement).not.toHaveClass('dark');
    expect(localStorage.getItem('theme')).toBe('light');
  });

  test('applies the language when it changes', async () => {
    mockApi();

    renderPage();
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Inglés' }));

    expect(await screen.findByRole('heading', { name: 'Welcome to dbiewer' })).toBeInTheDocument();
    expect(localStorage.getItem('language')).toBe('en');
  });
});
