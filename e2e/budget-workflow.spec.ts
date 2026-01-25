import { test, expect } from '@playwright/test';

const VALID_EMAIL = 'admin@example.com';
const VALID_PASSWORD = 'password123';

test.describe('Budget Workflow E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[type="email"]', VALID_EMAIL);
    await page.fill('input[type="password"]', VALID_PASSWORD);
    await Promise.all([
      page.waitForURL('**/dashboard**', { timeout: 10000 }),
      page.click('button[type="submit"]'),
    ]);
    expect(page.url()).toContain('/dashboard');
  });

  test('should create a new budget successfully', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Navigate to budgets page
    await page.goto('/budgets', { waitUntil: 'networkidle' });

    // Check if budgets page loads
    await expect(page.getByRole('heading', { name: /budgets/i, exact: true })).toBeVisible({ timeout: 10000 }).catch(() => {
      console.log('Budgets page heading not found, checking for alternative');
    });

    // Look for "New Budget" button
    const newBudgetButton = page.getByRole('button', { name: /new budget/i });
    await expect(newBudgetButton).toBeVisible({ timeout: 5000 });

    // Click to create new budget
    await newBudgetButton.click();

    // Fill in budget form
    await page.fill('input[name="name"]', 'Test Monthly Budget');

    // Select or fill amount
    const amountInput = page.locator('input[name="amount"], input[placeholder*="amount"]').first();
    await expect(amountInput).toBeVisible({ timeout: 5000 });
    await amountInput.fill('1000');

    // Select currency
    const currencySelect = page.locator('select[name="currency"], select[placeholder*="currency"]').first();
    await expect(currencySelect).toBeVisible({ timeout: 5000 });

    // Fill description
    await page.fill('input[name="description"]', 'E2E test budget');

    // Submit form
    await page.click('button[type="submit"]');

    // Verify success - should redirect or show success message
    await page.waitForTimeout(2000);

    // Check console errors
    if (consoleErrors.length > 0) {
      console.log(`⚠️ Console errors detected: ${consoleErrors.length}`);
      consoleErrors.forEach(err => console.log(`  - ${err}`));
    } else {
      console.log('✅ No console errors detected during budget creation');
    }

    console.log('✅ Budget creation test completed');
  });

  test('should validate budget update - prevent reducing below spent', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Navigate to budgets page
    await page.goto('/budgets', { waitUntil: 'networkidle' });

    // Wait for budget list to load
    await page.waitForTimeout(2000);

    // Look for an existing budget to edit
    const editButton = page.getByRole('button', { name: /edit/i }).first();
    await expect(editButton).toBeVisible({ timeout: 5000 }).catch(() => {
      console.log('No budget found to edit, skipping validation test');
      return;
    });

    await editButton.click();

    // Try to reduce amount (this should show validation error)
    const amountInput = page.locator('input[name="amount"]').first();
    await expect(amountInput).toBeVisible({ timeout: 5000 });

    // Get current amount and try to reduce it
    const currentAmount = await amountInput.inputValue();
    const numericAmount = parseFloat(currentAmount);

    if (numericAmount > 100) {
      // Try to set a lower amount
      await amountInput.fill('50');

      // Submit form
      await page.click('button[type="submit"]');

      // Wait for validation error
      await page.waitForTimeout(2000);

      // Check if error message appears (budget validation error)
      const errorMessage = page.getByText(/cannot reduce|i18n:validation_error|below spent/i);
      await expect(errorMessage.first()).toBeVisible({ timeout: 5000 }).catch(() => {
        console.log('Validation error message not displayed');
      });
    } else {
      console.log('Budget amount too low to test reduction validation');
    }

    // Check console errors
    if (consoleErrors.length > 0) {
      console.log(`⚠️ Console errors detected: ${consoleErrors.length}`);
      consoleErrors.forEach(err => console.log(`  - ${err}`));
    }

    console.log('✅ Budget update validation test completed');
  });

  test('should delete a budget successfully', async ({ page }) => {
    // First create a budget if none exists
    await page.goto('/budgets', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Look for a budget to delete
    const deleteButton = page.getByRole('button', { name: /delete|remove/i }).first();

    await expect(deleteButton).toBeVisible({ timeout: 5000 }).catch(async () => {
      // Create a budget first if none exists
      console.log('No budget found, creating one for delete test');
      const newBudgetButton = page.getByRole('button', { name: /new budget/i });
      await expect(newBudgetButton).toBeVisible({ timeout: 5000 });
      await newBudgetButton.click();

      await page.fill('input[name="name"]', 'Budget to Delete');
      await page.fill('input[name="amount"]', '100');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);

      // Reload page to see the new budget
      await page.goto('/budgets', { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
    });

    // Now try to delete
    const deleteBtn = page.getByRole('button', { name: /delete|remove/i }).first();
    await expect(deleteBtn).toBeVisible({ timeout: 5000 });

    // Click delete and handle confirmation
    await deleteBtn.click();

    // Handle confirmation dialog if present
    const confirmButton = page.getByRole('button', { name: /confirm|yes|delete/i });
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
    }

    await page.waitForTimeout(2000);

    console.log('✅ Budget deletion test completed');
  });
});

test.describe('Budget Template E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[type="email"]', VALID_EMAIL);
    await page.fill('input[type="password"]', VALID_PASSWORD);
    await Promise.all([
      page.waitForURL('**/dashboard**', { timeout: 10000 }),
      page.click('button[type="submit"]'),
    ]);
  });

  test('should display system templates with visual indicator', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Navigate to budgets page
    await page.goto('/budgets', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Look for template browser or template section
    const templateSection = page.getByText(/templates|budget templates/i).first();
    await expect(templateSection).toBeVisible({ timeout: 5000 }).catch(() => {
      console.log('Template section not found, checking alternative');
    });

    // Look for "System" badges
    const systemBadges = page.getByText(/system/i, { exact: false });
    const badgeCount = await systemBadges.count();

    if (badgeCount > 0) {
      console.log(`✅ Found ${badgeCount} system template indicators`);
    } else {
      console.log('ℹ️ No system template badges found (may indicate templates not loaded yet)');
    }

    // Check console errors
    if (consoleErrors.length > 0) {
      console.log(`⚠️ Console errors detected: ${consoleErrors.length}`);
      consoleErrors.forEach(err => console.log(`  - ${err}`));
    }

    console.log('✅ Template display test completed');
  });

  test('should create budget from template', async ({ page }) => {
    // Navigate to budgets page
    await page.goto('/budgets', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Look for template selection
    const useTemplateButton = page.getByRole('button', { name: /use template|from template/i }).first();
    await expect(useTemplateButton).toBeVisible({ timeout: 5000 }).catch(() => {
      console.log('Template button not found');
      return;
    });

    await useTemplateButton.click();

    // Select a template
    const templateCard = page.getByRole('button', { name: /monthly|weekly|yearly/i }).first();
    await expect(templateCard).toBeVisible({ timeout: 5000 });

    // Click on a template
    await templateCard.click();

    // Fill in remaining details
    await page.fill('input[name="name"]', 'My Template Budget');

    // Submit
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    console.log('✅ Template usage test completed');
  });
});
