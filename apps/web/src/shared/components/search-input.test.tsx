import { useState } from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test } from 'vitest';

import { render } from '../../../tests/render';

import { SearchInput } from './search-input';

const TestSearchInput = () => {
  const [value, setValue] = useState('');

  return <SearchInput value={value} placeholder="Search" onValueChange={setValue} />;
};

describe('SearchInput', () => {
  test('does not show the clear button without text', () => {
    render(<TestSearchInput />);

    expect(screen.getByRole('searchbox', { name: 'Search' })).toHaveValue('');
    expect(screen.queryByRole('button', { name: 'Borrar búsqueda' })).not.toBeInTheDocument();
  });

  test('shows the clear button only while there is text', async () => {
    render(<TestSearchInput />);
    const user = userEvent.setup();
    const input = screen.getByRole('searchbox', { name: 'Search' });

    await user.type(input, 'u');
    expect(screen.getByRole('button', { name: 'Borrar búsqueda' })).toBeInTheDocument();

    await user.clear(input);
    expect(screen.queryByRole('button', { name: 'Borrar búsqueda' })).not.toBeInTheDocument();
  });

  test('clears the text and returns the focus to the input', async () => {
    render(<TestSearchInput />);
    const user = userEvent.setup();
    const input = screen.getByRole('searchbox', { name: 'Search' });
    await user.type(input, 'users');

    await user.click(screen.getByRole('button', { name: 'Borrar búsqueda' }));

    expect(input).toHaveValue('');
    expect(input).toHaveFocus();
    expect(screen.queryByRole('button', { name: 'Borrar búsqueda' })).not.toBeInTheDocument();
  });
});
