import { test, expect } from '@playwright/test';
import { loginAsUser } from '../utils/auth';

test.describe('Mobile Responsiveness', () => {
  test.use({
    viewport: { width: 375, height: 667 }, // iPhone SE dimensions
  });

  test.beforeEach(async ({ page }) => {
    await loginAsUser(page);
  });

  test('should display mobile navigation menu', async ({ page }) => {
    // On mobile, navigation might be a hamburger menu
    const menuButton = page.locator('[data-testid="mobile-menu"]').or(page.locator('.hamburger-menu'));
    
    // Either menu button or navigation should be visible
    const isMenuVisible = await menuButton.isVisible().catch(() => false);
    const isNavVisible = await page.locator('nav').isVisible().catch(() => false);
    
    expect(isMenuVisible || isNavVisible).toBeTruthy();
  });

  test('should be able to navigate to journal on mobile', async ({ page }) => {
    // Navigate to journal page
    await page.goto('/journal');
    await page.waitForLoadState('networkidle');
    
    // Page title should be visible
    await expect(page.locator('h1')).toContainText('Journal');
  });

  test('should be able to navigate to settings on mobile', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    
    // Settings page should load
    await expect(page.locator('h1')).toContainText('Settings');
  });

  test('should display currencies table responsively on mobile', async ({ page }) => {
    await page.goto('/settings');
    await page.click('text=Currencies');
    await page.waitForLoadState('networkidle');
    
    // Table or card view should be visible
    const hasContent = await page.locator('table, .currency-card').first().isVisible();
    expect(hasContent).toBeTruthy();
  });

  test('should handle form inputs on mobile', async ({ page }) => {
    await page.goto('/journal');
    await page.click('text=New Entry');
    
    // Form should be usable on mobile
    const dateInput = page.locator('input[type="date"]').first();
    await expect(dateInput).toBeVisible();
    
    // Form fields should be large enough for touch
    const box = await dateInput.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(40); // Touch-friendly size
  });

  test('journal entry form should be scrollable on mobile', async ({ page }) => {
    await page.goto('/journal');
    await page.click('text=New Entry');
    
    // The form container should be scrollable
    const formContainer = page.locator('.journal-form, form').first();
    await expect(formContainer).toBeVisible();
    
    // Verify scroll is enabled
    const isScrollable = await formContainer.evaluate(el => {
      return el.scrollHeight > el.clientHeight;
    });
    
    expect(isScrollable).toBeTruthy();
  });
});

test.describe('Mobile - Different Devices', () => {
  test('should work on iPhone 12', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginAsUser(page);
    await page.goto('/journal');
    await expect(page.locator('h1')).toContainText('Journal');
  });

  test('should work on Android (Pixel 5)', async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 851 });
    await loginAsUser(page);
    await page.goto('/journal');
    await expect(page.locator('h1')).toContainText('Journal');
  });

  test('should work on iPad Mini', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await loginAsUser(page);
    await page.goto('/journal');
    await expect(page.locator('h1')).toContainText('Journal');
  });
});
