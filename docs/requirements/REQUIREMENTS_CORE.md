# Core Features Requirements

**Module:** Core Accounting
**References:** [PRD](../PRD.md), [Database](../REQUIREMENTS_DATABASE.md), [API](../REQUIREMENTS_API.md)

---

## Account Types

### 1.1 Five Account Categories

The system must support five fundamental account types based on accounting equation:

| Type | Purpose | Balance Direction | Examples |
|------|---------|-------------------|----------|
| **assets** | Resources owned | Debit (positive) | Bank accounts, cash, investments |
| **liabilities** | Obligations owed | Credit (negative) | Loans, credit cards, debts |
| **equity** | Owner's claim | Credit (negative) | Opening balance, retained earnings |
| **revenue** | Income earned | Credit (negative) | Salary, sales, interest income |
| **expense** | Costs incurred | Debit (positive) | Food, transport, utilities |

**See also:**
- [Database - accounts table](../REQUIREMENTS_DATABASE.md#accounts)
- [API - Account endpoints](../REQUIREMENTS_API.md#account-management-api)

### 1.2 Account Creation Requirements

#### Required Fields
- `name`: String (max 200 chars, unique within parent)
- `type`: Enum (assets/liabilities/equity/revenue/expense)
- `currency`: Currency code (must exist in currencies table)
- `parent_id`: Optional (for hierarchical structure)

#### Validation Rules
1. Parent account must be of same type or root category
2. Cannot create if parent has journal entries (prevent structural changes)
3. Name must be unique within sibling accounts
4. Currency must be active

**See also:**
- [API - Create account](../REQUIREMENTS_API.md#create-account-request-example)

### 1.3 Account Hierarchy

#### Structure Rules
- Unlimited nesting depth (no hard limit)
- Path computed column: `assets:bank:checking`
- Depth tracked for queries and display
- Parent changes require re-computation of child paths

#### Display Requirements
1. Show indented tree view (depth-based indentation)
2. Collapsible branches
3. Path search/filter support
4. Drag-and-drop reordering (future)

**See also:**
- [Database - path and depth](../REQUIREMENTS_DATABASE.md#account-structure)
- [Query Engine - depth parameter](../REQUIREMENTS_QUERY_ENGINE.md#depth-control)

---

## Journal Entries (Double-Entry Bookkeeping)

### 2.1 Journal Entry Structure

Each transaction must have:
- **Header**: date, description, reference_id
- **Lines**: 2+ lines (one transaction cannot have single line)
- **Balance**: Sum of all lines must equal zero

#### Line Requirements
| Field | Type | Description |
|-------|------|-------------|
| `account_id` | UUID | Target account |
| `amount` | Decimal | Positive or negative (direction derived from sign) |
| `currency` | String | Original currency of transaction |
| `exchange_rate` | Decimal | Optional (if currency differs from account) |
| `converted_amount` | Decimal | Optional (after conversion) |
| `tags` | String[] | Optional categorization |
| `remarks` | String | Optional notes |

**See also:**
- [Database - journal_entries and journal_lines](../REQUIREMENTS_DATABASE.md#journal-entries)
- [Multi-Currency - currency conversion](../REQUIREMENTS_MULTI_CURRENCY.md#transaction-currency-handling)

### 2.2 Validation Rules

#### Before Save
1. **Balance check**: SUM(amount) must equal zero
2. **Line count**: Minimum 2 lines per entry
3. **Account validity**: All accounts must exist and be active
4. **Currency validity**: Currency must exist and be active
5. **Rate availability**: If currency differs, rate must exist for date

#### Error Handling
- Return detailed error on validation failure
- Include which line caused the failure
- Suggest correction for common errors

**See also:**
- [API - Journal creation](../REQUIREMENTS_API.md#journal-management-api)

### 2.3 Transaction States

| State | Description | Allow Edit | Allow Delete |
|-------|-------------|------------|--------------|
| **pending** | Draft, not yet confirmed | Yes | Yes |
| **confirmed** | Finalized, affects balances | Limited | No |
| **voided** | Cancelled, preserved for audit | No | No |

---

## Balance Calculation

### 3.1 Real-Time vs Cached

#### Real-Time Calculation
- Used for small datasets (< 1000 entries)
- Calculated on query execution
- Always accurate to current state

#### Cached Balance
- Used for large datasets (> 1000 entries)
- Updated on journal entry save
- Cache invalidated on related entry change

**See also:**
- [Query Engine - caching strategy](../REQUIREMENTS_QUERY_ENGINE.md#caching)

### 3.2 Balance Formulas

```
Account Balance = SUM(JournalLines.amount)
                 WHERE account_id = target_account
                 AND journal_entry.status = 'confirmed'
```

```
Hierarchical Balance = SUM(child_accounts.balance)
                       + direct_entries.balance
```

**See also:**
- [Query Engine - balance queries](../REQUIREMENTS_QUERY_ENGINE.md#balance-queries)

---

## Cross-References

```
See also:
- [Database - Entity relationships](../REQUIREMENTS_DATABASE.md#entity-relationship-diagram)
- [API - Journal endpoints](../REQUIREMENTS_API.md#journal-management-api)
- [Multi-Currency - Exchange rates](../REQUIREMENTS_MULTI_CURRENCY.md)
- [Reports - Financial statements](../REQUIREMENTS_REPORTS.md)
```
