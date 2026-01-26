// Test data constants
export const TEST_USERS = {
  admin: {
    email: 'admin@example.com',
    password: 'AdminPassword123!',
  },
  user: {
    email: 'user@example.com',
    password: 'TestPassword123!',
  },
};

export const TEST_ACCOUNTS = {
  checking: {
    name: 'Checking Account',
    type: 'assets',
    currency: 'USD',
  },
  savings: {
    name: 'Savings Account',
    type: 'assets',
    currency: 'USD',
  },
};

export const TEST_JOURNAL_ENTRIES = {
  deposit: {
    description: 'Initial deposit',
    lines: [
      { accountId: 1, amount: 1000, type: 'debit' },
      { accountId: 2, amount: 1000, type: 'credit' },
    ],
  },
};

// Add more test data as needed
