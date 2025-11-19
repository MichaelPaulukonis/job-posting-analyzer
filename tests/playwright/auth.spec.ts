import { test, expect } from '@playwright/test';

test.describe('Auth flows', () => {
  test('visit login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/Login/);
  });
});
