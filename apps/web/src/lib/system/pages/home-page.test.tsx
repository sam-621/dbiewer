import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { gqlFetcher } from '@/lib/api/fetcher';

import { render } from '../../../../tests/render';

import { HomePage } from './home-page';

vi.mock('@/lib/api/fetcher');

describe('HomePage', () => {
  beforeEach(() => {
    vi.mocked(gqlFetcher).mockReset();
  });

  test('shows the API as connected when it is healthy', async () => {
    vi.mocked(gqlFetcher).mockResolvedValue({ health: true });

    render(<HomePage />);

    expect(await screen.findByText('API conectada')).toBeInTheDocument();
  });

  test('shows the API as unavailable when the request fails', async () => {
    vi.mocked(gqlFetcher).mockRejectedValue(new Error('Network error'));

    render(<HomePage />);

    expect(await screen.findByText('API no disponible')).toBeInTheDocument();
  });
});
