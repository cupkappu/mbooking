import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../utils/auth';

test.describe('Admin Currencies Page', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/currencies');
    await expect(page.locator('h1')).toContainText('Currency Management');
  });

  test('should load admin currencies page', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Currency Management');
    await expect(page.locator('text=Manage system currencies')).toBeVisible();
  });

  test('should display currencies table with headers', async ({ page }) => {
    await expect(page.locator('text=Code')).toBeVisible();
    await expect(page.locator('text=Name')).toBeVisible();
    await expect(page.locator('text=Symbol')).toBeVisible();
    await expect(page.locator('text=Decimal Places')).toBeVisible();
    await expect(page.locator('text=Status')).toBeVisible();
    await expect(page.locator('text=Actions')).toBeVisible();
  });

  test('should display action buttons', async ({ page }) => {
    await expect(page.locator('text=Add Currency')).toBeVisible();
    await expect(page.locator('text=Seed Default Currencies')).toBeVisible();
  });

  test('should open create currency dialog', async ({ page }) => {
    await page.click('text=Add Currency');
    await expect(page.locator('text=Create New Currency')).toBeVisible();
    await expect(page.locator('input[placeholder="USD"]')).toBeVisible();
    await expect(page.locator('input[placeholder="US Dollar"]')).toBeVisible();
    await expect(page.locator('input[placeholder="$"]')).toBeVisible();
  });

  test('should create a new currency', async ({ page }) => {
    await page.click('text=Add Currency');
    await page.fill('input[placeholder="USD"]', 'TEST');
    await page.fill('input[placeholder="US Dollar"]', 'Test Currency');
    await page.fill('input[placeholder="$"]', 'T');
    await page.click('button:has-text("Create Currency")');
    await expect(page.locator('text=TEST')).toBeVisible();
  });

  test('should filter currencies by search', async ({ page }) => {
    await page.fill('input[placeholder="Search currencies..."]', 'USD');
    await expect(page.locator('text=USD')).toBeVisible();
  });

  test('should refresh currencies', async ({ page }) => {
    await page.click('button:has-text("Refresh")');
    await expect(page.locator('h1')).toContainText('Currency Management');
  });

  test('should seed default currencies', async ({ page }) => {
    await page.click('button:has-text("Seed Default Currencies")');
    await expect(page.locator('text=Currencies seeded successfully')).toBeVisible();
  });

  test('should open edit dialog for a currency', async ({ page }) => {
    const editButton = page.locator('button:has-text("Edit")').first();
    await editButton.click();
    await expect(page.locator('text=Edit Currency')).toBeVisible();
  });

  test('should open delete dialog for a currency', async ({ page }) => {
    const deleteButton = page.locator('[data-testid="delete-currency"]').first();
    await deleteButton.click();
    await expect(page.locator('text=Delete Currency')).toBeVisible();
    await expect(page.locator('text=This action cannot be undone')).toBeVisible();
  });

  test('should cancel create dialog', async ({ page }) => {
    await page.click('text=Add Currency');
    await expect(page.locator('text=Create New Currency')).toBeVisible();
    await page.click('button:has-text("Cancel")');
    await expect(page.locator('text=Create New Currency')).not.toBeVisible();
  });

  test('should show active/inactive badges', async ({ page }) => {
    await expect(page.locator('text=Active')).toBeVisible();
    await expect(page.locator('text=Inactive')).toBeVisible();
  });

  test('should navigate via admin sidebar', async ({ page }) => {
    await page.click('a[href="/admin/currencies"]');
    await expect(page.locator('h1')).toContainText('Currency Management');
  });
});

test.describe('Admin Currencies Page - Access Control', () => {
  test('should not allow regular users to access admin currencies', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'user@example.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    await page.goto('/admin/currencies');
    await expect(page.locator('h1')).not.toContainText('Currency Management');
  });
});
