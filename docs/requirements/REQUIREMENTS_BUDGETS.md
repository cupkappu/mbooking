# Budget Management Requirements

**Module:** Budget Tracking & Alerts
**References:** [PRD](../PRD.md), [Core Features](../REQUIREMENTS_CORE.md), [Database](../REQUIREMENTS_DATABASE.md), [API](../REQUIREMENTS_API.md)

---

## Overview

Budget management allows users to set spending limits and track progress against budgets with alerts.

**Budget types:**
- Periodic (monthly, weekly, yearly)
- Non-periodic (one-time targets)

---

## Budget Types

### 1.1 Periodic Budgets

| Type | Description | Use Case |
|------|-------------|----------|
| **monthly** | Recurring every calendar month | Regular expenses |
| **weekly** | Recurring every week | Tight expense control |
| **yearly** | Recurring every year | Annual planning |

#### Creation Parameters
```typescript
interface PeriodicBudget {
  name: string;
  account_path: string;      // Target account
  amount: number;
  currency: string;
  period_type: 'monthly' | 'weekly' | 'yearly';
  start_date: Date;
  end_date?: Date;           // Optional, for limited duration
  alert_threshold: number;   // e.g., 0.8 (80%)
  is_active: boolean;
}
```

### 1.2 Non-Periodic Budgets

| Type | Description | Use Case |
|------|-------------|----------|
| **single** | One-time spending limit | Purchase tracking |
| **target** | Savings goal | Financial target |

#### Creation Parameters
```typescript
interface NonPeriodicBudget {
  name: string;
  account_path?: string;     // Optional, for category budgets
  amount: number;
  currency: string;
  is_single_transaction: boolean;  // Alert on single large purchase
  start_date: Date;
  end_date?: Date;
  alert_threshold: number;
  is_active: boolean;
}
```

**See also:**
- [Database - budgets table](../REQUIREMENTS_DATABASE.md#budgets)

---

## Budget Tracking

### 2.1 Spending Calculation

```
spent_amount = SUM(JournalLines.amount)
               WHERE account_path STARTS WITH budget.account_path
               AND date BETWEEN budget period
               AND journal_entry.status = 'confirmed'
```

### 2.2 Progress Calculation

```typescript
interface BudgetProgress {
  budget_id: string;
  spent_amount: number;
  remaining_amount: number;
  percentage_used: number;
  days_remaining: number;
  projected_spend: number;   // Based on current rate
  status: 'normal' | 'warning' | 'exceeded';
}
```

### 2.3 Status Thresholds

| Status | Condition |
|--------|-----------|
| **normal** | percentage < alert_threshold |
| **warning** | alert_threshold <= percentage < 100% |
| **exceeded** | percentage >= 100% |

---

## Alert System

### 3.1 Alert Types

| Type | Trigger | Action |
|------|---------|--------|
| **Threshold** | Reached threshold | Show banner, send notification |
| **Exceeded** | Budget exceeded | Show urgent alert |
| **Period End** | Budget period ending soon | Reminder to review |

### 3.2 Alert Configuration

```typescript
interface AlertConfig {
  budget_id: string;
  enabled: boolean;
  channels: ('email' | 'push' | 'in_app')[];
  threshold_percent: number;
  reminder_days_before_end: number[];
}
```

### 3.3 Notification Channels

| Channel | Description | Priority |
|---------|-------------|----------|
| **in_app** | Banner in dashboard | High |
| **email** | Email notification | Medium |
| **push** | Mobile push (future) | High |

**See also:**
- [API - Budget alerts](../REQUIREMENTS_API.md#budget-management-api)

---

## Budget Operations

### 4.1 API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/budgets` | List all budgets |
| POST | `/api/v1/budgets` | Create budget |
| GET | `/api/v1/budgets/:id` | Get budget details |
| PUT | `/api/v1/budgets/:id` | Update budget |
| DELETE | `/api/v1/budgets/:id` | Delete budget |
| GET | `/api/v1/budgets/:id/progress` | Get progress |

### 4.2 Validation Rules

1. Amount must be positive
2. End date must be after start date
3. Cannot delete budget with active spending
4. Can only reduce budget if > current spending

### 4.3 Budget Templates

Pre-defined templates for common budgets:
```json
{
  "templates": [
    { "name": "Monthly Food", "type": "monthly", "account_path": "expense:food" },
    { "name": "Monthly Transport", "type": "monthly", "account_path": "expense:transport" },
    { "name": "Yearly Vacation", "type": "yearly", "account_path": "expense:travel" }
  ]
}
```

---

## Cross-References

```
See also:
- [Core Features - Account hierarchy for targeting](../REQUIREMENTS_CORE.md#account-hierarchy)
- [Database - budgets entity](../REQUIREMENTS_DATABASE.md#budgets)
- [API - Budget endpoints](../REQUIREMENTS_API.md#budget-management-api)
- [Query Engine - Filtering by date/account](../REQUIREMENTS_QUERY_ENGINE.md#journal-entry-queries)
```
