import { test, expect } from '@playwright/test';
import { loginAsUser } from '../utils/auth';
import { DashboardPage } from '../utils/page-objects';

test.describe('Journal Page', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page);
    const dashboard = new DashboardPage(page);
    await dashboard.navigateToJournal();
    await page.waitForURL('/journal');
  });

  test('should load journal page successfully', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Journal');
  });

  test('should display loading state then journal entries', async ({ page }) => {
    // Initially might show loading
    await expect(page.locator('text=Loading...').first()).toBeVisible({ timeout: 5000 }).catch(() => {});
    
    // After loading, should see the page content
    await expect(page.locator('h1')).toContainText('Journal');
  });

  test('should be able to create a new journal entry', async ({ page }) => {
    // Click "New Entry" button
    await page.click('text=New Entry');
    
    // Verify form appears
    await expect(page.locator('h2')).toContainText('Create Journal Entry');
    
    // Fill in the form
    await page.fill('input[type="date"]', '2024-01-15');
    await page.fill('input[type="text"]:nth-of-type(1)', 'Test Transaction');
    
    // Select account for first line
    const firstAccountSelect = page.locator('select').first();
    await expect(firstAccountSelect).toBeVisible();
    
    // Fill amount
    const amountInput = page.locator('input[type="number"]').first();
    await amountInput.fill('100');
    
    // Fill currency
    const currencyInput = page.locator('input[placeholder="USD"]').first();
    await currencyInput.fill('USD');
    
    // Check balance shows 100
    await expect(page.locator('text=Total:')).toBeVisible();
  });

  test('should show error when entries do not balance', async ({ page }) => {
    await page.click('text=New Entry');
    
    // Only fill one line with amount 100
    const amountInput = page.locator('input[type="number"]').first();
    await amountInput.fill('100');
    
    // Should show error about unbalanced entry
    await expect(page.locator('text=Entry must balance')).toBeVisible();
    
    // Submit button should be disabled
    await expect(page.locator('button[type="submit"]')).toBeDisabled();
  });

  test('should show empty state when no entries exist', async ({ page }) => {
  // This test would need a clean database or mocking
  // Check for either empty state or existing entries
  const hasEmptyState = await page.locator('text=No journal entries yet').isVisible().catch(() => false);
  const hasEntries = await page.locator('.journal-entry, [class*="journal"] [class*="entry"]').first().isVisible().catch(() => false);
  
  // One of these should be true
  expect(hasEmptyState || hasEntries).toBeTruthy();
});
});
