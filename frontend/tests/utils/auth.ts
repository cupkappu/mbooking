import { Page } from '@playwright/test';
import { TEST_USERS } from './test-data';

export async function loginAsAdmin(page: Page) {
  await page.goto('/login');
  await page.fill('input[type="email"]', TEST_USERS.admin.email);
  await page.fill('input[type="password"]', TEST_USERS.admin.password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/dashboard');
}

export async function loginAsUser(page: Page) {
  await page.goto('/login');
  await page.fill('input[type="email"]', TEST_USERS.user.email);
  await page.fill('input[type="password"]', TEST_USERS.user.password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/dashboard');
}

export async function logout(page: Page) {
  // Assuming there's a logout button in the user menu
  await page.click('[data-testid="user-menu"]');
  await page.click('text=Logout');
  await page.waitForURL('/login');
}

// Add more auth helpers as needed
