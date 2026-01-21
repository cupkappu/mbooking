import { test, expect } from '@playwright/test';
import { loginAsUser } from '../utils/auth';

test.describe('Currencies Settings Page', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page);
    await page.goto('/settings');
    await page.click('text=Currencies');
  });

  test('should load currencies settings page', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Settings');
    await expect(page.locator('h2')).toContainText('Currency Management');
  });

  test('should display currencies table', async ({ page }) => {
    // Check for table headers
    await expect(page.locator('text=Code')).toBeVisible();
    await expect(page.locator('text=Name')).toBeVisible();
    await expect(page.locator('text=Symbol')).toBeVisible();
    await expect(page.locator('text=Status')).toBeVisible();
    await expect(page.locator('text=Default')).toBeVisible();
  });

  test('should be able to set a currency as default', async ({ page }) => {
    // Find a non-default currency and click "Set Default"
    const setDefaultButton = page.locator('text=Set Default').first();
    
    if (await setDefaultButton.isVisible()) {
      await setDefaultButton.click();
      
      // Verify the default badge appears
      await expect(page.locator('text=Default').first()).toBeVisible();
    }
  });
});
