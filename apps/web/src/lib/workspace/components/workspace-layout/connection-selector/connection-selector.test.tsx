import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { gqlFetcher } from '@/lib/api/fetcher';

import { render } from '../../../../../../tests/render';
import { ActiveConnectionProvider } from '../../../contexts/active-connection-provider';

import { ConnectionSelector } from './connection-selector';

vi.mock('@/lib/api/fetcher');

const createConnection = (id: string, name: string, host: string) => ({
  id,
  name,
  host,
  port: 5432,
  database: 'acme',
  username: 'ana',
  hasPassword: true,
  sslMode: 'REQUIRE'
});

const PROD = createConnection('connection-2', 'Acme prod', 'db.acme.dev');
const STAGING = createConnection('connection-1', 'Acme staging', 'staging.acme.dev');

const mockConnections = (items: (typeof PROD)[]) =>
  vi.mocked(gqlFetcher).mockResolvedValue({ connections: { items } });

const renderSelector = () =>
  render(
    <ActiveConnectionProvider>
      <ConnectionSelector />
    </ActiveConnectionProvider>
  );

describe('ConnectionSelector', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(gqlFetcher).mockReset();
  });

  test('renders the active connection', async () => {
    mockConnections([PROD, STAGING]);

    renderSelector();

    const trigger = await screen.findByRole('button', { name: /Acme prod/ });
    expect(trigger).not.toHaveTextContent('db.acme.dev');
  });

  test('does not render without connections', async () => {
    mockConnections([]);

    renderSelector();

    await vi.waitFor(() => expect(gqlFetcher).toHaveBeenCalled());
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  test('shows the connections with the active one checked', async () => {
    mockConnections([PROD, STAGING]);

    renderSelector();
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: /Acme prod/ }));

    const prod = await screen.findByRole('menuitemradio', { name: /Acme prod/ });
    const staging = screen.getByRole('menuitemradio', { name: /Acme staging/ });
    expect(prod).toHaveAttribute('aria-checked', 'true');
    expect(staging).toHaveAttribute('aria-checked', 'false');
    expect(staging).toHaveTextContent('staging.acme.dev');
  });

  test('changes the active connection', async () => {
    mockConnections([PROD, STAGING]);

    renderSelector();
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: /Acme prod/ }));
    await user.click(await screen.findByRole('menuitemradio', { name: /Acme staging/ }));

    expect(await screen.findByRole('button', { name: /Acme staging/ })).toBeInTheDocument();
    expect(localStorage.getItem('dbiewer:active-connection')).toBe(STAGING.id);
  });

  test('creates a connection from the selector and makes it the active one', async () => {
    const created = createConnection('connection-3', 'Acme dev', 'dev.acme.dev');
    let items = [PROD, STAGING];
    vi.mocked(gqlFetcher).mockImplementation(async document => {
      const query = document.toString();
      if (query.includes('mutation TestConnection')) {
        return { testConnection: { apiErrors: [], success: true } };
      }
      if (query.includes('mutation CreateConnection')) {
        items = [created, ...items];
        return { createConnection: { apiErrors: [], connection: created } };
      }
      return { connections: { items } };
    });

    renderSelector();
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: /Acme prod/ }));
    await user.click(await screen.findByRole('menuitem', { name: 'Nueva conexión' }));

    const dialog = await screen.findByRole('dialog', { name: 'Nueva conexión' });
    await user.type(within(dialog).getByLabelText('Nombre'), 'Acme dev');
    await user.type(within(dialog).getByLabelText('Host'), 'dev.acme.dev');
    await user.type(within(dialog).getByLabelText('Base de datos'), 'acme');
    await user.type(within(dialog).getByLabelText('Usuario'), 'ana');
    await user.click(within(dialog).getByRole('button', { name: 'Guardar' }));

    expect(await screen.findByRole('button', { name: /Acme dev/ })).toBeInTheDocument();
    expect(localStorage.getItem('dbiewer:active-connection')).toBe(created.id);
    await vi.waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Nueva conexión' })).not.toBeInTheDocument()
    );
  });
});
