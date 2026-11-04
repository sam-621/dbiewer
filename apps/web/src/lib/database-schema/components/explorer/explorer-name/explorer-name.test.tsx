import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, test, vi } from 'vitest';

import { render } from '../../../../../../tests/render';

import { ExplorerName } from './explorer-name';

const NAME = 'custom_object_entry_values';

const mockWidths = (scrollWidth: number, clientWidth: number) => {
  vi.spyOn(Element.prototype, 'scrollWidth', 'get').mockReturnValue(scrollWidth);
  vi.spyOn(Element.prototype, 'clientWidth', 'get').mockReturnValue(clientWidth);
};

const renderRow = (onClick = vi.fn()) =>
  render(
    <button type="button" onClick={onClick}>
      <ExplorerName name={NAME} />
    </button>
  );

describe('ExplorerName', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('shows the full name over the row while hovering a truncated name', async () => {
    mockWidths(300, 120);
    renderRow();

    await userEvent.hover(screen.getByRole('button', { name: NAME }));

    expect(screen.getAllByText(NAME)).toHaveLength(2);
  });

  test('does not show anything when the name fits', async () => {
    mockWidths(120, 120);
    renderRow();

    await userEvent.hover(screen.getByRole('button', { name: NAME }));

    expect(screen.getAllByText(NAME)).toHaveLength(1);
  });

  test('does not leave a native title on the name', () => {
    renderRow();

    expect(screen.getByText(NAME)).not.toHaveAttribute('title');
  });

  test('hides the full name when leaving the row', async () => {
    mockWidths(300, 120);
    renderRow();
    const row = screen.getByRole('button', { name: NAME });

    await userEvent.hover(row);
    await userEvent.unhover(row);

    expect(screen.getAllByText(NAME)).toHaveLength(1);
  });

  test('hides the full name when the tree scrolls', async () => {
    mockWidths(300, 120);
    renderRow();

    await userEvent.hover(screen.getByRole('button', { name: NAME }));
    fireEvent.scroll(document.body);

    expect(screen.getAllByText(NAME)).toHaveLength(1);
  });

  test('keeps the row clickable while the full name is shown', async () => {
    mockWidths(300, 120);
    const onClick = vi.fn();
    renderRow(onClick);

    await userEvent.click(screen.getByRole('button', { name: NAME }));

    expect(screen.getAllByText(NAME)).toHaveLength(2);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
