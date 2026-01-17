import { Page } from '@playwright/test';

// Page Object Model for common elements
export class BasePage {
  constructor(protected page: Page) {}

  async goto(path: string) {
    await this.page.goto(path);
  }

  async waitForLoad() {
    await this.page.waitForLoadState('networkidle');
  }
}

export class LoginPage extends BasePage {
  private emailInput = this.page.locator('input[type="email"]');
  private passwordInput = this.page.locator('input[type="password"]');
  private loginButton = this.page.locator('button[type="submit"]');

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }
}

export class DashboardPage extends BasePage {
  private accountsLink = this.page.locator('a[href="/accounts"]');
  private journalLink = this.page.locator('a[href="/journal"]');
  private reportsLink = this.page.locator('a[href="/reports"]');

  async navigateToAccounts() {
    await this.accountsLink.click();
  }

  async navigateToJournal() {
    await this.journalLink.click();
  }

  async navigateToReports() {
    await this.reportsLink.click();
  }
}

// Add more page objects as needed
