import { expect, test } from '@playwright/test';

test('shows the app name and the API status', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'dbiewer' })).toBeVisible();
  await expect(page.getByRole('status')).toHaveText('API conectada');
});

test('shows not found for an unknown route', async ({ page }) => {
  await page.goto('/does-not-exist');

  await expect(page.getByRole('heading', { name: 'Página no encontrada' })).toBeVisible();
});
