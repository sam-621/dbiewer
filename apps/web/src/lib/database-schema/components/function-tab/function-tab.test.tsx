import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { gqlFetcher } from '@/lib/api/fetcher';

import { render } from '../../../../../tests/render';

import { FunctionTab, type FunctionTabObject } from './function-tab';

vi.mock('@/lib/api/fetcher');

const REFRESH_STATS: FunctionTabObject = {
  schema: 'public',
  name: 'refresh_stats',
  arguments: 'since date, OUT total integer'
};

const DEFINITION =
  'CREATE OR REPLACE FUNCTION public.refresh_stats()\n RETURNS void\n LANGUAGE sql';

const mockDefinition = (result: unknown) =>
  vi.mocked(gqlFetcher).mockImplementation(async () => {
    const value = await result;
    if (value instanceof Error) throw value;
    return value;
  });

const definitionResult = (definition: string | null, apiErrors: unknown[] = []) => ({
  functionDefinition: { apiErrors, definition }
});

const renderTab = () =>
  render(
    <div className="h-96">
      <FunctionTab connectionId="connection-1" object={REFRESH_STATS} />
    </div>
  );

describe('FunctionTab', () => {
  beforeEach(() => {
    vi.mocked(gqlFetcher).mockReset();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  test('shows a loading state while the definition loads', async () => {
    mockDefinition(new Promise<never>(() => {}));

    renderTab();

    expect(await screen.findByRole('status', { name: 'Cargando la función' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Copiar definición' })).not.toBeInTheDocument();
  });

  test('requests the definition with the arguments as they came from the schema', async () => {
    mockDefinition(definitionResult(DEFINITION));

    renderTab();
    await screen.findByRole('textbox', { name: 'Definición de la función' });

    expect(gqlFetcher).toHaveBeenCalledWith(expect.anything(), {
      input: {
        connectionId: 'connection-1',
        schema: 'public',
        name: 'refresh_stats',
        arguments: 'since date, OUT total integer'
      }
    });
  });

  test('shows the definition read only, without run actions or results', async () => {
    mockDefinition(definitionResult(DEFINITION));

    renderTab();
    const editor = await screen.findByRole('textbox', { name: 'Definición de la función' });

    expect(editor).toHaveTextContent('CREATE OR REPLACE FUNCTION public.refresh_stats()');
    expect(editor).toHaveAttribute('aria-readonly', 'true');
    expect(screen.getByText('Función · solo lectura')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Ejecutar/ })).not.toBeInTheDocument();
  });

  test('does not change the definition when typing', async () => {
    mockDefinition(definitionResult('select 1'));

    renderTab();
    const editor = await screen.findByRole('textbox', { name: 'Definición de la función' });
    const user = userEvent.setup();
    await user.click(editor);
    await user.keyboard('{Enter}');

    expect(editor).toHaveTextContent(/^select 1$/);
  });

  test('copies the definition', async () => {
    mockDefinition(definitionResult(DEFINITION));

    renderTab();
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Copiar definición' }));

    expect(await navigator.clipboard.readText()).toBe(DEFINITION);
  });

  test('shows the query error and retries', async () => {
    mockDefinition(
      definitionResult(null, [{ code: 'QUERY_FAILED', message: 'permission denied for function' }])
    );

    renderTab();
    expect(await screen.findByText('permission denied for function')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Copiar definición' })).not.toBeInTheDocument();

    mockDefinition(definitionResult(DEFINITION));
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Intentar de nuevo' }));

    expect(
      await screen.findByRole('textbox', { name: 'Definición de la función' })
    ).toHaveTextContent('CREATE OR REPLACE FUNCTION');
  });

  test('shows a generic error when the request fails', async () => {
    mockDefinition(new Error('Network error'));

    renderTab();

    expect(await screen.findByText('Algo salió mal')).toBeInTheDocument();
  });

  test('shows an empty state when the function no longer exists', async () => {
    mockDefinition(definitionResult(null, [{ code: 'OBJECT_NOT_FOUND', message: 'Not found' }]));

    renderTab();

    expect(await screen.findByText('Este objeto ya no existe')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Intentar de nuevo' })).not.toBeInTheDocument();
  });
});
