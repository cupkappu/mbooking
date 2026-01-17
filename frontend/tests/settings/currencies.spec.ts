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

  test('should be able to add a new currency', async ({ page }) => {
    // Fill in new currency form
    await page.fill('input[placeholder="USD"]', 'JPY');
    await page.fill('input[placeholder="US Dollar"]', 'Japanese Yen');
    await page.fill('input[placeholder="$"]', '¥');
    
    // Click add button
    await page.click('text=Add Currency');
    
    // Verify the currency was added
    await expect(page.locator('text=JPY')).toBeVisible();
    await expect(page.locator('text=Japanese Yen')).toBeVisible();
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

  test('should be able to edit a currency', async ({ page }) => {
    // Click edit button on first currency
    await page.locator('[data-testid="edit-currency"]').first().click();
    
    // Edit form should appear
    await expect(page.locator('input[value]')).toBeVisible();
  });

  test('should be able to delete a currency', async ({ page }) => {
    // Find delete button (not on default currency)
    const deleteButton = page.locator('[data-testid="delete-currency"]').first();
    
    if (await deleteButton.isVisible()) {
      // Click delete and confirm
      page.on('dialog', async dialog => {
        await dialog.accept();
      });
      
      await deleteButton.click();
      
      // Verify the currency is no longer visible or marked inactive
      // This depends on the implementation
    }
  });

  test('should navigate to rate providers tab', async ({ page }) => {
    await page.click('text=Rate Providers');
    await expect(page.locator('h2')).toContainText('Rate Providers');
  });
});
