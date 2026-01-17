# Reports Requirements

**Module:** Financial Statements & Reports
**References:** [PRD](../PRD.md), [Core Features](../REQUIREMENTS_CORE.md), [Query Engine](../REQUIREMENTS_QUERY_ENGINE.md), [API](../REQUIREMENTS_API.md)

---

## Overview

Generate standard financial statements from account balances and journal entries.

**Report types:**
- Balance Sheet
- Income Statement (Profit & Loss)
- Cash Flow Statement (future)

---

## Balance Sheet

### 1.1 Report Structure

```
BALANCE SHEET
As of: {date}

ASSETS
├── Current Assets
│   ├── Cash and Cash Equivalents
│   │   ├── Bank Accounts
│   │   └── Petty Cash
│   └── Accounts Receivable
└── Non-Current Assets
    └── Investments

LIABILITIES
├── Current Liabilities
│   ├── Accounts Payable
│   └── Credit Cards
└── Non-Current Liabilities
    └── Loans

EQUITY
├── Owner's Equity
└── Retained Earnings

LIABILITIES + EQUITY = ASSETS ✓
```

### 1.2 API Endpoint

**POST** `/api/v1/query/reports/balance-sheet`

### 1.3 Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `as_of_date` | Date | Yes | Report date |
| `depth` | Number | No | Account detail depth |
| `convert_to` | String | No | Target currency |
| `exchange_rate_date` | String | No | Rate source |

### 1.4 Response Structure

```typescript
interface BalanceSheetResponse {
  report: {
    title: string;
    as_of_date: string;
    generated_at: string;
    sections: {
      assets: AccountGroup[];
      liabilities: AccountGroup[];
      equity: AccountGroup[];
    };
    totals: {
      assets: number;
      liabilities: number;
      equity: number;
      currency: string;
    };
  };
}
```

**See also:**
- [Core Features - Account types](../REQUIREMENTS_CORE.md#five-account-categories)
- [Query Engine - Balance queries](../REQUIREMENTS_QUERY_ENGINE.md#balance-queries)

---

## Income Statement

### 2.1 Report Structure

```
INCOME STATEMENT
Period: {from} to {to}

REVENUE
├── Sales Revenue
├── Interest Income
└── Other Income
    Total Revenue: XXX

EXPENSES
├── Operating Expenses
│   ├── Salaries
│   └── Rent
├── Cost of Goods Sold
└── Other Expenses
    Total Expenses: XXX

NET INCOME = REVENUE - EXPENSES
```

### 2.2 API Endpoint

**POST** `/api/v1/query/reports/income-statement`

### 2.3 Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `from_date` | Date | Yes | Period start |
| `to_date` | Date | Yes | Period end |
| `depth` | Number | No | Account detail depth |
| `compare_to` | Object | No | Prior period comparison |

### 2.4 Period Comparison

```json
{
  "compare_to": {
    "from": "2024-01-01",
    "to": "2024-12-31"
  }
}
```

Response includes variance analysis:
- Absolute change
- Percentage change

---

## Cash Flow Statement (Future)

### 3.1 Planned Structure

```
CASH FLOW STATEMENT
Period: {from} to {to}

OPERATING ACTIVITIES
├── Net Income
├── Adjustments (depreciation, etc.)
└── Changes in Working Capital

INVESTING ACTIVITIES
├── Purchase of Assets
└── Sale of Assets

FINANCING ACTIVITIES
├── Capital Injection
└── Loan Repayments

NET CASH CHANGE
Beginning Cash Balance
Ending Cash Balance
```

---

## Report Generation

### 4.1 Generation Methods

| Method | Use Case |
|--------|----------|
| **On-demand** | User requests report, generated实时 |
| **Cached** | Frequently accessed reports cached 1 hour |
| **Scheduled** | Auto-generate monthly reports (future) |

### 4.2 Export Options

| Format | Description |
|--------|-------------|
| **JSON** | API response format |
| **CSV** | Spreadsheet import |
| **PDF** | Printable document |
| **Excel** | Multi-sheet workbook (future) |

### 4.3 Report Storage

| Field | Description |
|-------|-------------|
| `id` | Report UUID |
| `type` | Report type |
| `title` | Display title |
| `content` | JSON report data |
| `generated_at` | Creation timestamp |
| `date_range` | Report period |
| `tenant_id` | Owner |

**See also:**
- [Database - reports table](../REQUIREMENTS_DATABASE.md#reports)

---

## Cross-References

```
See also:
- [Core Features - Account hierarchy](../REQUIREMENTS_CORE.md#account-hierarchy)
- [Query Engine - Balance queries with depth](../REQUIREMENTS_QUERY_ENGINE.md#depth-control)
- [Multi-Currency - Currency conversion in reports](../REQUIREMENTS_MULTI_CURRENCY.md#transaction-currency-handling)
- [API - Report endpoints](../REQUIREMENTS_API.md#report-generation)
```
