import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './utils/auth';

test.describe('Example Tests', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Multi-Currency Accounting/);
  });

  test('should login and access dashboard', async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });

  test('should navigate to accounts page', async ({ page }) => {
    await loginAsAdmin(page);
    await page.click('a[href="/accounts"]');
    await expect(page).toHaveURL('/accounts');
  });

  // Add more example tests as needed
});
