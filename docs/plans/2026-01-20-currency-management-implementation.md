# Currency Management Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Secure currency management by making CRUD admin-only, converting user-facing inputs to dropdowns, and adding seed functionality.

**Architecture:** Split currencies into public read-only endpoints (any authenticated user) and admin CRUD endpoints (`@Roles('admin')`). User-facing forms use dropdowns populated from the read-only API.

**Tech Stack:** NestJS (backend), Next.js + React Query (frontend), TypeORM, Jest

---

## Phase 1: Backend Changes

### Task 1: Modify CurrenciesController - Remove CRUD, Keep Read-Only

**Files:**
- Modify: `backend/src/currencies/currencies.controller.ts`
- Test: `backend/src/currencies/currencies.controller.spec.ts`

**Step 1: Write the failing test**

```typescript
// backend/src/currencies/currencies.controller.spec.ts
describe('CurrenciesController', () => {
  let controller: CurrenciesController;
  let service: CurrenciesService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [CurrenciesController],
      providers: [CurrenciesService],
    }).compile();

    controller = module.get<CurrenciesController>(CurrenciesController);
    service = module.get<CurrenciesService>(CurrenciesService);
  });

  describe('findAll', () => {
    it('should return active currencies for any authenticated user', async () => {
      const mockCurrencies = [
        { code: 'USD', name: 'US Dollar', symbol: '$', decimal_places: 2, is_active: true },
        { code: 'EUR', name: 'Euro', symbol: '€', decimal_places: 2, is_active: true },
      ];
      jest.spyOn(service, 'findAll').mockResolvedValue(mockCurrencies as any);

      const result = await controller.findAll();

      expect(result).toEqual(mockCurrencies);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  it('should NOT have create method', () => {
    expect(controller.create).toBeUndefined();
  });

  it('should NOT have update method', () => {
    expect((controller as any).update).toBeUndefined();
  });

  it('should NOT have delete method', () => {
    expect((controller as any).delete).toBeUndefined();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd /Users/kifuko/dev/multi_currency_accounting/.worktrees/currency-management/backend
npm test -- --testPathPattern="currencies.controller.spec.ts"
```
Expected: FAIL - controller still has create/update/delete methods

**Step 3: Write minimal implementation**

```typescript
// backend/src/currencies/currencies.controller.ts
import {
  Controller,
  Get,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { CurrenciesService } from './currencies.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('currencies')
@Controller('currencies')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CurrenciesController {
  constructor(private currenciesService: CurrenciesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all active currencies (for dropdowns)' })
  @ApiResponse({ status: 200, description: 'Returns all active currencies' })
  async findAll() {
    return this.currenciesService.findAll();
  }

  @Get(':code')
  @ApiOperation({ summary: 'Get currency by code' })
  @ApiResponse({ status: 200, description: 'Returns the currency' })
  @ApiNotFoundResponse({ description: 'Currency not found' })
  async findOne(@Param('code') code: string) {
    return this.currenciesService.findByCode(code);
  }
}
```

**Step 4: Run test to verify it passes**

```bash
cd /Users/kifuko/dev/multi_currency_accounting/.worktrees/currency-management/backend
npm test -- --testPathPattern="currencies.controller.spec.ts"
```
Expected: PASS

**Step 5: Commit**

```bash
cd /Users/kifuko/dev/multi_currency_accounting/.worktrees/currency-management
git add backend/src/currencies/currencies.controller.ts backend/src/currencies/currencies.controller.spec.ts
git commit -m "refactor: make currencies controller read-only for public users"
```

---

### Task 2: Enhance CurrenciesService - Add validateCurrencyExists

**Files:**
- Modify: `backend/src/currencies/currencies.service.ts`
- Test: `backend/src/currencies/currencies.service.spec.ts`

**Step 1: Write the failing test**

```typescript
// backend/src/currencies/currencies.service.spec.ts
describe('CurrenciesService', () => {
  // ... existing tests ...

  describe('validateCurrencyExists', () => {
    it('should return currency when it exists and is active', async () => {
      const mockCurrency = { code: 'USD', name: 'US Dollar', is_active: true };
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockCurrency as any);

      const result = await service.validateCurrencyExists('USD');

      expect(result).toEqual(mockCurrency);
    });

    it('should throw BadRequestException when currency not found', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.validateCurrencyExists('XXX'))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when currency is inactive', async () => {
      const mockCurrency = { code: 'USD', name: 'US Dollar', is_active: false };
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockCurrency as any);

      await expect(service.validateCurrencyExists('USD'))
        .rejects.toThrow(BadRequestException);
    });
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd /Users/kifuko/dev/multi_currency_accounting/.worktrees/currency-management/backend
npm test -- --testPathPattern="currencies.service.spec.ts"
```
Expected: FAIL - validateCurrencyExists not defined

**Step 3: Write minimal implementation**

```typescript
// Add to CurrenciesService class in currencies.service.ts
async validateCurrencyExists(code: string): Promise<Currency> {
  const currency = await this.findByCode(code);
  if (!currency || !currency.is_active) {
    throw new BadRequestException(
      `Currency '${code}' is not available. Contact your administrator.`
    );
  }
  return currency;
}
```

**Step 4: Run test to verify it passes**

```bash
cd /Users/kifuko/dev/multi_currency_accounting/.worktrees/currency-management/backend
npm test -- --testPathPattern="currencies.service.spec.ts"
```
Expected: PASS

**Step 5: Commit**

```bash
cd /Users/kifuko/dev/multi_currency_accounting/.worktrees/currency-management
git add backend/src/currencies/currencies.service.ts backend/src/currencies/currencies.service.spec.ts
git commit -m "feat: add validateCurrencyExists method for currency validation"
```

---

### Task 3: Enhance CurrenciesService - Idempotent Seed Logic

**Files:**
- Modify: `backend/src/currencies/currencies.service.ts`
- Test: `backend/src/currencies/currencies.service.spec.ts`

**Step 1: Write the failing test**

```typescript
describe('seedDefaultCurrencies', () => {
  it('should create missing currencies and update existing ones', async () => {
    jest.spyOn(repository, 'findOne')
      .mockResolvedValueOnce(null) // USD doesn't exist
      .mockResolvedValueOnce({ code: 'EUR', name: 'Old Euro' } as any); // EUR exists with old name

    jest.spyOn(repository, 'create').mockReturnValue({} as any);
    jest.spyOn(repository, 'save').mockResolvedValue({} as any);

    await service.seedDefaultCurrencies();

    expect(repository.create).toHaveBeenCalledTimes(13); // 14 - 1 existing (EUR)
    expect(repository.save).toHaveBeenCalledTimes(13);
  });

  it('should not duplicate currencies that already exist with correct data', async () => {
    jest.spyOn(repository, 'findOne').mockResolvedValue({
      code: 'USD',
      name: 'US Dollar',
      symbol: '$',
      decimal_places: 2,
      is_active: true,
    } as any);

    await service.seedDefaultCurrencies();

    expect(repository.create).not.toHaveBeenCalled();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd /Users/kifuko/dev/multi_currency_accounting/.worktrees/currency-management/backend
npm test -- --testPathPattern="currencies.service.spec.ts"
```
Expected: FAIL - seedDefaultCurrencies doesn't have idempotent logic

**Step 3: Write minimal implementation**

```typescript
// Replace existing seedDefaultCurrencies with:
async seedDefaultCurrencies(): Promise<{ added: number; skipped: number }> {
  const defaultCurrencies = [
    { code: 'USD', name: 'US Dollar', symbol: '$', decimal_places: 2 },
    { code: 'EUR', name: 'Euro', symbol: '€', decimal_places: 2 },
    { code: 'GBP', name: 'British Pound', symbol: '£', decimal_places: 2 },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥', decimal_places: 0 },
    { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', decimal_places: 2 },
    { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', decimal_places: 2 },
    { code: 'TWD', name: 'Taiwan Dollar', symbol: 'NT$', decimal_places: 2 },
    { code: 'KRW', name: 'South Korean Won', symbol: '₩', decimal_places: 0 },
    { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', decimal_places: 2 },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', decimal_places: 2 },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', decimal_places: 2 },
    { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr', decimal_places: 2 },
    { code: 'BTC', name: 'Bitcoin', symbol: '₿', decimal_places: 8 },
    { code: 'ETH', name: 'Ethereum', symbol: 'Ξ', decimal_places: 18 },
  ];

  let added = 0;
  let skipped = 0;

  for (const currency of defaultCurrencies) {
    try {
      const existing = await this.findByCode(currency.code);
      
      // Update if exists but has missing/incorrect data
      const needsUpdate = 
        existing.name !== currency.name ||
        (existing.symbol || '') !== (currency.symbol || '') ||
        existing.decimal_places !== currency.decimal_places;
      
      if (needsUpdate) {
        await this.update(currency.code, {
          name: currency.name,
          symbol: currency.symbol,
          decimal_places: currency.decimal_places,
        });
        console.log(`[Seed] Updated currency: ${currency.code}`);
        skipped++;
      } else {
        console.log(`[Seed] Currency already up to date: ${currency.code}`);
        skipped++;
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        await this.create(currency);
        console.log(`[Seed] Added currency: ${currency.code}`);
        added++;
      } else {
        throw error;
      }
    }
  }

  return { added, skipped };
}
```

**Step 4: Run test to verify it passes**

```bash
cd /Users/kifuko/dev/multi_currency_accounting/.worktrees/currency-management/backend
npm test -- --testPathPattern="currencies.service.spec.ts"
```
Expected: PASS

**Step 5: Commit**

```bash
cd /Users/kifuko/dev/multi_currency_accounting/.worktrees/currency-management
git add backend/src/currencies/currencies.service.ts
git commit -m "feat: add idempotent seed logic for default currencies"
```

---

### Task 4: Add Admin Currency Endpoints

**Files:**
- Modify: `backend/src/admin/admin.controller.ts`
- Modify: `backend/src/admin/admin.service.ts`

**Step 1: Write the failing test**

```typescript
// backend/src/admin/admin.service.spec.ts (add to existing describe)
describe('Currency Management', () => {
  const mockAdminId = 'admin-uuid';
  const mockIp = '127.0.0.1';

  beforeEach(async () => {
    // ... existing setup
  });

  describe('createCurrency', () => {
    it('should create currency with audit logging', async () => {
      const dto = { code: 'AAPL', name: 'Apple Inc.', symbol: '$', decimal_places: 2 };
      jest.spyOn(currenciesService, 'findByCode').mockRejectedValue(new NotFoundException());
      jest.spyOn(currenciesService, 'create').mockResolvedValue({ ...dto, id: 'uuid' } as any);

      const result = await service.createCurrency(dto, mockAdminId, mockIp);

      expect(result.code).toBe('AAPL');
      expect(auditLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'currency.create' })
      );
    });

    it('should throw ConflictException if currency exists', async () => {
      const dto = { code: 'USD', name: 'US Dollar', symbol: '$', decimal_places: 2 };
      jest.spyOn(currenciesService, 'findByCode').mockResolvedValue({ code: 'USD' } as any);

      await expect(service.createCurrency(dto, mockAdminId, mockIp))
        .rejects.toThrow(ConflictException);
    });
  });

  describe('deleteCurrency', () => {
    it('should soft delete currency with audit logging', async () => {
      jest.spyOn(currenciesService, 'delete').mockResolvedValue(undefined);

      await service.deleteCurrency('USD', mockAdminId, mockIp);

      expect(currenciesService.delete).toHaveBeenCalledWith('USD');
      expect(auditLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'currency.delete' })
      );
    });
  });

  describe('seedCurrencies', () => {
    it('should seed currencies and log action', async () => {
      jest.spyOn(currenciesService, 'seedDefaultCurrencies').mockResolvedValue({ added: 14, skipped: 0 });

      await service.seedCurrencies(mockAdminId, mockIp);

      expect(currenciesService.seedDefaultCurrencies).toHaveBeenCalled();
      expect(auditLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'currency.seed' })
      );
    });
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd /Users/kifuko/dev/multi_currency_accounting/.worktrees/currency-management/backend
npm test -- --testPathPattern="admin.service.spec.ts"
```
Expected: FAIL - createCurrency, deleteCurrency, seedCurrencies methods don't exist

**Step 3: Write minimal implementation**

```typescript
// Add to AdminController (after existing provider management section):
// Currency Management Section
@Post('currencies')
@Roles('admin')
@ApiOperation({ summary: 'Create a new currency' })
@ApiResponse({ status: 201, description: 'Currency created successfully' })
async createCurrency(@Body() dto: CreateCurrencyDto) {
  return this.adminService.createCurrency(dto);
}

@Put('currencies/:code')
@Roles('admin')
@ApiOperation({ summary: 'Update a currency' })
async updateCurrency(
  @Param('code') code: string,
  @Body() dto: UpdateCurrencyDto,
) {
  return this.adminService.updateCurrency(code, dto);
}

@Delete('currencies/:code')
@Roles('admin')
@HttpCode(HttpStatus.NO_CONTENT)
@ApiOperation({ summary: 'Soft delete a currency' })
async deleteCurrency(@Param('code') code: string) {
  await this.adminService.deleteCurrency(code);
}

@Post('currencies/seed')
@Roles('admin')
@ApiOperation({ summary: 'Seed default currencies (idempotent)' })
@ApiResponse({ status: 200, description: 'Currencies seeded successfully' })
async seedCurrencies() {
  await this.adminService.seedCurrencies();
  return { success: true, message: '14 currencies seeded successfully' };
}

@Get('currencies')
@Roles('admin')
@ApiOperation({ summary: 'List all currencies (including inactive)' })
async listCurrencies() {
  return this.adminService.getAllCurrencies();
}
```

```typescript
// Add to AdminService:
async createCurrency(dto: CreateCurrencyDto): Promise<Currency> {
  const existing = await this.currenciesService.findByCode(dto.code).catch(() => null);
  if (existing) {
    throw new ConflictException(`Currency '${dto.code}' already exists`);
  }

  const currency = await this.currenciesService.create(dto);
  
  await this.auditLog({
    action: 'currency.create',
    entity_type: 'currency',
    entity_id: currency.code,
    user_id: this.getCurrentUserId(),
    ip_address: this.getCurrentIp(),
    metadata: { currency },
  });

  return currency;
}

async updateCurrency(code: string, dto: UpdateCurrencyDto): Promise<Currency> {
  const currency = await this.currenciesService.update(code, dto);
  
  await this.auditLog({
    action: 'currency.update',
    entity_type: 'currency',
    entity_id: code,
    user_id: this.getCurrentUserId(),
    ip_address: this.getCurrentIp(),
    metadata: { changes: dto },
  });

  return currency;
}

async deleteCurrency(code: string): Promise<void> {
  await this.currenciesService.delete(code);
  
  await this.auditLog({
    action: 'currency.delete',
    entity_type: 'currency',
    entity_id: code,
    user_id: this.getCurrentUserId(),
    ip_address: this.getCurrentIp(),
  });
}

async seedCurrencies(): Promise<void> {
  const results = await this.currenciesService.seedDefaultCurrencies();
  
  await this.auditLog({
    action: 'currency.seed',
    entity_type: 'currency',
    entity_id: 'system',
    user_id: this.getCurrentUserId(),
    ip_address: this.getCurrentIp(),
    metadata: { ...results },
  });
}

async getAllCurrencies(): Promise<Currency[]> {
  return this.currencyRepository.find({
    order: { code: 'ASC' },
  });
}

// Helper methods (add if not exist)
private getCurrentUserId(): string {
  // Get from request context - implementation depends on your setup
  return 'system';
}

private getCurrentIp(): string {
  // Get from request context
  return '127.0.0.1';
}
```

**Step 4: Run test to verify it passes**

```bash
cd /Users/kifuko/dev/multi_currency_accounting/.worktrees/currency-management/backend
npm test -- --testPathPattern="admin.service.spec.ts"
```
Expected: PASS (may need to adjust mock setup based on actual implementation)

**Step 5: Commit**

```bash
cd /Users/kifuko/dev/multi_currency_accounting/.worktrees/currency-management
git add backend/src/admin/admin.controller.ts backend/src/admin/admin.service.ts
git commit -m "feat: add admin-only currency CRUD endpoints"
```

---

### Task 5: Add Currency Validation to Journal Service

**Files:**
- Modify: `backend/src/journal/journal.service.ts`

**Step 1: Write the failing test**

```typescript
// In comprehensive.tdd.spec.ts or new test file
describe('Journal Service - Currency Validation', () => {
  it('should validate currencies exist before creating journal entry', async () => {
    const dto = {
      date: new Date(),
      description: 'Test entry',
      lines: [
        { account_id: 'acc-1', amount: 100, currency: 'USD' },
        { account_id: 'acc-2', amount: -100, currency: 'INVALID' },
      ],
    };

    await expect(service.create(dto)).rejects.toThrow(BadRequestException);
  });

  it('should allow journal entry with valid currencies', async () => {
    const dto = {
      date: new Date(),
      description: 'Test entry',
      lines: [
        { account_id: 'acc-1', amount: 100, currency: 'USD' },
        { account_id: 'acc-2', amount: -100, currency: 'EUR' },
      ],
    };

    jest.spyOn(currenciesService, 'validateCurrencyExists').mockResolvedValue({} as any);
    jest.spyOn(journalEntryRepository, 'create').mockReturnValue({} as any);
    jest.spyOn(journalEntryRepository, 'save').mockResolvedValue({ id: 'entry-1' } as any);
    jest.spyOn(journalLineRepository, 'create').mockReturnValue({} as any);
    jest.spyOn(journalLineRepository, 'save').mockResolvedValue([]);

    const result = await service.create(dto);

    expect(result).toBeDefined();
    expect(currenciesService.validateCurrencyExists).toHaveBeenCalledTimes(2);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd /Users/kifuko/dev/multi_currency_accounting/.worktrees/currency-management/backend
npm test -- --testPathPattern="comprehensive.tdd.spec.ts"
```
Expected: FAIL - no currency validation

**Step 3: Write minimal implementation**

```typescript
// In journal.service.ts create method:
async create(data: {
  date: Date;
  description: string;
  reference_id?: string;
  lines: Array<{
    account_id: string;
    amount: number;
    currency: string;
    exchange_rate?: number;
    converted_amount?: number;
    tags?: string[];
    remarks?: string;
  }>;
}): Promise<JournalEntry> {
  const tenantId = this.getTenantId();
  const userId = this.getUserId();
  
  // Validate all currencies exist
  const currencySet = new Set(data.lines.map(l => l.currency));
  for (const currency of currencySet) {
    await this.currenciesService.validateCurrencyExists(currency);
  }
  
  this.validateBalancedLines(data.lines);
  // ... rest of implementation
}
```

**Step 4: Run test to verify it passes**

```bash
cd /Users/kifuko/dev/multi_currency_accounting/.worktrees/currency-management/backend
npm test -- --testPathPattern="comprehensive.tdd.spec.ts"
```
Expected: PASS

**Step 5: Commit**

```bash
cd /Users/kifuko/dev/multi_currency_accounting/.worktrees/currency-management
git add backend/src/journal/journal.service.ts
git commit -m "feat: add currency validation to journal entries"
```

---

### Task 6: Add Currency Validation to Account Service

**Files:**
- Modify: `backend/src/accounts/accounts.service.ts`

**Step 1: Write the failing test**

```typescript
// In accounts.service.spec.ts or new test
describe('Account Service - Currency Validation', () => {
  it('should reject account creation with invalid currency', async () => {
    const dto = {
      name: 'Test Account',
      type: AccountType.ASSETS,
      currency: 'INVALID',
    };

    jest.spyOn(currenciesService, 'validateCurrencyExists').mockRejectedValue(
      new BadRequestException('Currency INVALID not found')
    );

    await expect(service.create(dto)).rejects.toThrow(BadRequestException);
  });

  it('should allow account creation with valid currency', async () => {
    const dto = {
      name: 'Test Account',
      type: AccountType.ASSETS,
      currency: 'USD',
    };

    jest.spyOn(currenciesService, 'validateCurrencyExists').mockResolvedValue({} as any);
    jest.spyOn(accountRepository, 'create').mockReturnValue({} as any);
    jest.spyOn(accountRepository, 'save').mockResolvedValue({} as any);

    const result = await service.create(dto);

    expect(result).toBeDefined();
    expect(currenciesService.validateCurrencyExists).toHaveBeenCalledWith('USD');
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd /Users/kifuko/dev/multi_currency_accounting/.worktrees/currency-management/backend
npm test -- --testPathPattern="accounts.service.spec.ts"
```
Expected: FAIL - no currency validation

**Step 3: Write minimal implementation**

```typescript
// In accounts.service.ts create method:
async create(data: CreateAccountDto): Promise<Account> {
  const tenantId = TenantContext.requireTenantId();
  
  // Validate currency exists
  await this.currenciesService.validateCurrencyExists(data.currency);
  
  // ... rest of implementation
}
```

**Step 4: Run test to verify it passes**

```bash
cd /Users/kifuko/dev/multi_currency_accounting/.worktrees/currency-management/backend
npm test -- --testPathPattern="accounts.service.spec.ts"
```
Expected: PASS

**Step 5: Commit**

```bash
cd /Users/kifuko/dev/multi_currency_accounting/.worktrees/currency-management
git add backend/src/accounts/accounts.service.ts
git commit -m "feat: add currency validation to account creation"
```

---

## Phase 2: Frontend New Files

### Task 7: Create use-currencies Hook

**Files:**
- Create: `frontend/hooks/use-currencies.ts`
- Test: `frontend/hooks/__tests__/use-currencies.spec.ts`

**Step 1: Write the failing test**

```typescript
// frontend/hooks/__tests__/use-currencies.spec.ts
import { renderHook, waitFor } from '@testing-library/react';
import { useCurrencies } from '../use-currencies';
import { currenciesApi } from '@/lib/currencies';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('@/lib/currencies', () => ({
  currenciesApi: {
    getAll: jest.fn(),
  },
}));

describe('useCurrencies', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={new QueryClient()}>
      {children}
    </QueryClientProvider>
  );

  it('should return currencies from API', async () => {
    const mockCurrencies = [
      { code: 'USD', name: 'US Dollar', symbol: '$', decimal_places: 2 },
      { code: 'EUR', name: 'Euro', symbol: '€', decimal_places: 2 },
    ];
    (currenciesApi.getAll as jest.Mock).mockResolvedValue(mockCurrencies);

    const { result } = renderHook(() => useCurrencies(), { wrapper });

    await waitFor(() => {
      expect(result.current.data).toEqual(mockCurrencies);
    });
  });

  it('should have correct default staleTime', async () => {
    (currenciesApi.getAll as jest.Mock).mockResolvedValue([]);

    const { result } = renderHook(() => useCurrencies(), { wrapper });

    expect(result.current.staleTime).toBe(5 * 60 * 1000); // 5 minutes
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd /Users/kifuko/dev/multi_currency_accounting/.worktrees/currency-management/frontend
npm test -- --testPathPattern="use-currencies.spec.ts"
```
Expected: FAIL - file doesn't exist

**Step 3: Write minimal implementation**

```typescript
// frontend/hooks/use-currencies.ts
import { useQuery } from '@tanstack/react-query';
import { currenciesApi } from '@/lib/currencies';
import type { Currency } from '@/types/currency';

export function useCurrencies() {
  return useQuery({
    queryKey: ['currencies'],
    queryFn: () => currenciesApi.getAll(),
    staleTime: 5 * 60 * 1000, // 5 minutes - currencies don't change often
    retry: 1,
  });
}

export function useCurrency(code: string) {
  return useQuery({
    queryKey: ['currencies', code],
    queryFn: () => currenciesApi.getById(code),
    enabled: !!code,
  });
}
```

**Step 4: Run test to verify it passes**

```bash
cd /Users/kifuko/dev/multi_currency_accounting/.worktrees/currency-management/frontend
npm test -- --testPathPattern="use-currencies.spec.ts"
```
Expected: PASS

**Step 5: Commit**

```bash
cd /Users/kifuko/dev/multi_currency_accounting/.worktrees/currency-management
git add frontend/hooks/use-currencies.ts frontend/hooks/__tests__/use-currencies.spec.ts
git commit -m "feat: add useCurrencies hook for fetching currencies"
```

---

### Task 8: Create Admin Currency API Client

**Files:**
- Create: `frontend/lib/admin-currencies.ts`

**Step 1: Write the failing test**

```typescript
// frontend/lib/__tests__/admin-currencies.spec.ts
import { adminCurrenciesApi } from '../admin-currencies';
import { apiClient } from '../api';

jest.mock('../api', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('adminCurrenciesApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should get all currencies', async () => {
    const mockCurrencies = [{ code: 'USD' }, { code: 'EUR' }];
    (apiClient.get as jest.Mock).mockResolvedValue(mockCurrencies);

    const result = await adminCurrenciesApi.getAll();

    expect(apiClient.get).toHaveBeenCalledWith('/admin/currencies');
    expect(result).toEqual(mockCurrencies);
  });

  it('should create currency', async () => {
    const dto = { code: 'AAPL', name: 'Apple Inc.', decimal_places: 2 };
    (apiClient.post as jest.Mock).mockResolvedValue(dto);

    const result = await adminCurrenciesApi.create(dto);

    expect(apiClient.post).toHaveBeenCalledWith('/admin/currencies', dto);
    expect(result).toEqual(dto);
  });

  it('should delete currency', async () => {
    (apiClient.delete as jest.Mock).mockResolvedValue(undefined);

    await adminCurrenciesApi.delete('AAPL');

    expect(apiClient.delete).toHaveBeenCalledWith('/admin/currencies/AAPL');
  });

  it('should seed currencies', async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({ success: true, message: 'done' });

    const result = await adminCurrenciesApi.seed();

    expect(apiClient.post).toHaveBeenCalledWith('/admin/currencies/seed', {});
    expect(result).toEqual({ success: true, message: 'done' });
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd /Users/kifuko/dev/multi_currency_accounting/.worktrees/currency-management/frontend
npm test -- --testPathPattern="admin-currencies.spec.ts"
```
Expected: FAIL - file doesn't exist

**Step 3: Write minimal implementation**

```typescript
// frontend/lib/admin-currencies.ts
import { apiClient } from './api';
import type { Currency } from '@/types/currency';

export interface CreateCurrencyRequest {
  code: string;
  name: string;
  symbol?: string;
  decimal_places: number;
}

export interface UpdateCurrencyRequest {
  name?: string;
  symbol?: string;
  decimal_places?: number;
  is_active?: boolean;
}

export const adminCurrenciesApi = {
  async getAll(): Promise<Currency[]> {
    return apiClient.get<Currency[]>('/admin/currencies');
  },

  async getById(code: string): Promise<Currency> {
    return apiClient.get<Currency>(`/admin/currencies/${code}`);
  },

  async create(data: CreateCurrencyRequest): Promise<Currency> {
    return apiClient.post<Currency>('/admin/currencies', data);
  },

  async update(code: string, data: UpdateCurrencyRequest): Promise<Currency> {
    return apiClient.put<Currency>(`/admin/currencies/${code}`, data);
  },

  async delete(code: string): Promise<void> {
    return apiClient.delete<void>(`/admin/currencies/${code}`);
  },

  async seed(): Promise<{ success: boolean; message: string }> {
    return apiClient.post('/admin/currencies/seed', {});
  },
};
```

**Step 4: Run test to verify it passes**

```bash
cd /Users/kifuko/dev/multi_currency_accounting/.worktrees/currency-management/frontend
npm test -- --testPathPattern="admin-currencies.spec.ts"
```
Expected: PASS

**Step 5: Commit**

```bash
cd /Users/kifuko/dev/multi_currency_accounting/.worktrees/currency-management
git add frontend/lib/admin-currencies.ts frontend/lib/__tests__/admin-currencies.spec.ts
git commit -m "feat: add adminCurrencies API client"
```

---

### Task 9: Create Admin Currency Management Page

**Files:**
- Create: `frontend/app/(admin)/currencies/page.tsx`
- Test: `frontend/app/(admin)/currencies/__tests__/page.spec.tsx`

**Step 1: Write the failing test**

```typescript
// frontend/app/(admin)/currencies/__tests__/page.spec.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdminCurrenciesPage } from '../page';
import { adminCurrenciesApi } from '@/lib/admin-currencies';
import { useSession } from 'next-auth/react';

jest.mock('@/lib/admin-currencies', () => ({
  adminCurrenciesApi: {
    getAll: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    seed: jest.fn(),
  },
}));

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

describe('AdminCurrenciesPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useSession as jest.Mock).mockReturnValue({
      data: { user: { role: 'admin' } },
    });
    (adminCurrenciesApi.getAll as jest.Mock).mockResolvedValue([
      { code: 'USD', name: 'US Dollar', symbol: '$', decimal_places: 2, is_active: true },
    ]);
  });

  it('should show seed defaults button', () => {
    render(<AdminCurrenciesPage />);
    expect(screen.getByRole('button', { name: /seed defaults/i })).toBeInTheDocument();
  });

  it('should show add currency button', () => {
    render(<AdminCurrenciesPage />);
    expect(screen.getByRole('button', { name: /add currency/i })).toBeInTheDocument();
  });

  it('should call seed API when seed button clicked', async () => {
    (adminCurrenciesApi.seed as jest.Mock).mockResolvedValue({ success: true, message: 'done' });

    render(<AdminCurrenciesPage />);
    fireEvent.click(screen.getByRole('button', { name: /seed defaults/i }));

    await waitFor(() => {
      expect(adminCurrenciesApi.seed).toHaveBeenCalled();
    });
  });

  it('should show add currency form when add button clicked', () => {
    render(<AdminCurrenciesPage />);
    fireEvent.click(screen.getByRole('button', { name: /add currency/i }));
    expect(screen.getByLabelText(/currency code/i)).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd /Users/kifuko/dev/multi_currency_accounting/.worktrees/currency-management/frontend
npm test -- --testPathPattern="admin/currencies/page.spec.tsx"
```
Expected: FAIL - file doesn't exist

**Step 3: Write minimal implementation**

```tsx
// frontend/app/(admin)/currencies/page.tsx
'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { adminCurrenciesApi } from '@/lib/admin-currencies';
import type { Currency } from '@/types/currency';

export default function AdminCurrenciesPage() {
  const [activeTab, setActiveTab] = useState<'list' | 'add'>('list');
  const [newCurrency, setNewCurrency] = useState({
    code: '',
    name: '',
    symbol: '',
    decimal_places: 2,
  });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: currencies, isLoading } = useQuery({
    queryKey: ['admin', 'currencies'],
    queryFn: () => adminCurrenciesApi.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof newCurrency) => adminCurrenciesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'currencies'] });
      toast({ title: 'Currency created successfully', variant: 'success' });
      setActiveTab('list');
      setNewCurrency({ code: '', name: '', symbol: '', decimal_places: 2 });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to create currency', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (code: string) => adminCurrenciesApi.delete(code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'currencies'] });
      toast({ title: 'Currency deleted', variant: 'success' });
    },
  });

  const seedMutation = useMutation({
    mutationFn: () => adminCurrenciesApi.seed(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'currencies'] });
      toast({ title: 'Default currencies seeded', variant: 'success' });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Currency Management</h1>
          <p className="text-muted-foreground">Manage system-wide currencies</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => seedMutation.mutate()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Seed Defaults
          </Button>
          <Button onClick={() => setActiveTab('add')}>
            <Plus className="w-4 h-4 mr-2" />
            Add Currency
          </Button>
        </div>
      </div>

      {activeTab === 'list' && (
        <Card>
          <CardHeader>
            <CardTitle>All Currencies</CardTitle>
            <CardDescription>System-wide currencies available to all users</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Decimals</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currencies?.map((currency) => (
                  <TableRow key={currency.code}>
                    <TableCell className="font-medium">{currency.code}</TableCell>
                    <TableCell>{currency.name}</TableCell>
                    <TableCell>{currency.symbol || '-'}</TableCell>
                    <TableCell>{currency.decimal_places}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        currency.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {currency.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {currency.is_active && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm(`Delete ${currency.code}?`)) {
                              deleteMutation.mutate(currency.code);
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {currencies?.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No currencies found. Click "Add Currency" or "Seed Defaults" to get started.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'add' && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Currency</CardTitle>
            <CardDescription>Add a currency that will be available to all users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 max-w-md">
              <div className="space-y-2">
                <Label htmlFor="code">Currency Code *</Label>
                <Input
                  id="code"
                  placeholder="AAPL"
                  value={newCurrency.code}
                  onChange={(e) => setNewCurrency({ 
                    ...newCurrency, 
                    code: e.target.value.toUpperCase() 
                  })}
                  maxLength={10}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  placeholder="Apple Inc."
                  value={newCurrency.name}
                  onChange={(e) => setNewCurrency({ 
                    ...newCurrency, 
                    name: e.target.value 
                  })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="symbol">Symbol</Label>
                <Input
                  id="symbol"
                  placeholder="$"
                  value={newCurrency.symbol}
                  onChange={(e) => setNewCurrency({ 
                    ...newCurrency, 
                    symbol: e.target.value 
                  })}
                  maxLength={10}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="decimals">Decimal Places</Label>
                <Select
                  value={String(newCurrency.decimal_places)}
                  onValueChange={(value) => setNewCurrency({ 
                    ...newCurrency, 
                    decimal_places: parseInt(value) 
                  })}
                >
                  <SelectTrigger id="decimals">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0 (no decimals)</SelectItem>
                    <SelectItem value="2">2 (standard)</SelectItem>
                    <SelectItem value="4">4</SelectItem>
                    <SelectItem value="8">8 (Bitcoin)</SelectItem>
                    <SelectItem value="18">18 (Ethereum)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <Button 
                onClick={() => createMutation.mutate(newCurrency)}
                disabled={!newCurrency.code || !newCurrency.name || createMutation.isPending}
              >
                {createMutation.isPending ? 'Creating...' : 'Create Currency'}
              </Button>
              <Button variant="outline" onClick={() => setActiveTab('list')}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

```bash
cd /Users/kifuko/dev/multi_currency_accounting/.worktrees/currency-management/frontend
npm test -- --testPathPattern="admin/currencies/page.spec.tsx"
```
Expected: PASS (may need to adjust based on UI library mocks)

**Step 5: Commit**

```bash
cd /Users/kifuko/dev/multi_currency_accounting/.worktrees/currency-management
git add frontend/app/\(admin\)/currencies/page.tsx frontend/app/\(admin\)/currencies/__tests__/page.spec.tsx
git commit -m "feat: add admin currency management page"
```

---

### Task 10: Add Currencies to Admin Navigation

**Files:**
- Modify: `frontend/app/(admin)/layout.tsx`

**Step 1: Write the failing test**

```typescript
// frontend/app/(admin)/__tests__/layout.spec.tsx
import { render, screen } from '@testing-library/react';
import { AdminLayout } from '../layout';

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

describe('AdminLayout', () => {
  it('should show currencies in navigation', () => {
    (useSession as jest.Mock).mockReturnValue({ data: { user: { role: 'admin' } } });

    render(
      <AdminLayout>
        <div>Content</div>
      </AdminLayout>
    );

    expect(screen.getByText('Currencies')).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd /Users/kifuko/dev/multi_currency_accounting/.worktrees/currency-management/frontend
npm test -- --testPathPattern="admin/layout.spec.tsx"
```
Expected: FAIL - Currencies nav item doesn't exist

**Step 3: Write minimal implementation**

```typescript
// In frontend/app/(admin)/layout.tsx - add DollarSign import and update navItems:
// Add to imports:
import { DollarSign } from 'lucide-react';

// Update navItems array:
const adminNavItems = [
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/currencies', label: 'Currencies', icon: DollarSign }, // ADD THIS
  { href: '/admin/system', label: 'Settings', icon: Settings },
  { href: '/admin/providers', label: 'Providers', icon: Server },
  { href: '/admin/logs', label: 'Audit Logs', icon: FileText },
  { href: '/admin/export', label: 'Data Export', icon: Download },
  { href: '/admin/plugins', label: 'Plugins', icon: Plug },
  { href: '/admin/scheduler', label: 'Scheduler', icon: Clock },
  { href: '/admin/health', label: 'Health', icon: Heart },
];
```

**Step 4: Run test to verify it passes**

```bash
cd /Users/kifuko/dev/multi_currency_accounting/.worktrees/currency-management/frontend
npm test -- --testPathPattern="admin/layout.spec.tsx"
```
Expected: PASS

**Step 5: Commit**

```bash
cd /Users/kifuko/dev/multi_currency_accounting/.worktrees/currency-management
git add frontend/app/\(admin\)/layout.tsx
git commit -m "feat: add currencies to admin navigation"
```

---

## Phase 3: Frontend Modifications

### Task 11: Convert Account Form Currency to Dropdown

**Files:**
- Modify: `frontend/components/accounts/account-form.tsx`
- Test: `frontend/components/accounts/__tests__/account-form.spec.tsx`

**Step 1: Write the failing test**

```typescript
// frontend/components/accounts/__tests__/account-form.spec.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AccountForm } from '../account-form';
import { useCurrencies } from '@/hooks/use-currencies';

jest.mock('@/hooks/use-currencies', () => ({
  useCurrencies: jest.fn(),
}));

describe('AccountForm - Currency Dropdown', () => {
  const mockCurrencies = [
    { code: 'USD', name: 'US Dollar', symbol: '$', decimal_places: 2, is_active: true },
    { code: 'EUR', name: 'Euro', symbol: '€', decimal_places: 2, is_active: true },
    { code: 'AAPL', name: 'Apple Inc.', symbol: '$', decimal_places: 2, is_active: true },
  ];

  beforeEach(() => {
    (useCurrencies as jest.Mock).mockReturnValue({
      data: mockCurrencies,
      isLoading: false,
    });
  });

  it('should render currency dropdown with all available currencies', () => {
    render(<AccountForm formData={{}} setFormData={jest.fn()} />);

    const select = screen.getByRole('combobox', { name: /currency/i });
    fireEvent.click(select);

    expect(screen.getByText('USD - US Dollar')).toBeInTheDocument();
    expect(screen.getByText('EUR - Euro')).toBeInTheDocument();
    expect(screen.getByText('AAPL - Apple Inc.')).toBeInTheDocument();
  });

  it('should NOT allow free-text input', () => {
    render(<AccountForm formData={{}} setFormData={jest.fn()} />);

    expect(screen.queryByPlaceholderText('USD')).not.toBeInTheDocument();
  });

  it('should show loading state when currencies are loading', () => {
    (useCurrencies as jest.Mock).mockReturnValue({
      data: null,
      isLoading: true,
    });

    render(<AccountForm formData={{}} setFormData={jest.fn()} />);

    expect(screen.getByPlaceholderText('Loading...')).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd /Users/kifuko/dev/multi_currency_accounting/.worktrees/currency-management/frontend
npm test -- --testPathPattern="accounts/account-form.spec.tsx"
```
Expected: FAIL - still uses Input

**Step 3: Write minimal implementation**

```typescript
// frontend/components/accounts/account-form.tsx
import { useCurrencies } from '@/hooks/use-currencies';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// In the form component, replace currency Input with:
<div className="space-y-2">
  <Label htmlFor="currency">Currency</Label>
  {isLoading ? (
    <Input id="currency" disabled placeholder="Loading..." />
  ) : (
    <Select
      value={formData.currency}
      onValueChange={(value) => setFormData({ ...formData, currency: value })}
    >
      <SelectTrigger id="currency">
        <SelectValue placeholder="Select currency" />
      </SelectTrigger>
      <SelectContent>
        {currencies?.map((currency) => (
          <SelectItem key={currency.code} value={currency.code}>
            <span className="flex items-center gap-2">
              <span>{currency.symbol || ''}</span>
              <span>{currency.code}</span>
              <span className="text-muted-foreground">- {currency.name}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )}
  <p className="text-xs text-muted-foreground">
    Currency cannot be changed after creation
  </p>
</div>
```

**Step 4: Run test to verify it passes**

```bash
cd /Users/kifuko/dev/multi_currency_accounting/.worktrees/currency-management/frontend
npm test -- --testPathPattern="accounts/account-form.spec.tsx"
```
Expected: PASS

**Step 5: Commit**

```bash
cd /Users/kifuko/dev/multi_currency_accounting/.worktrees/currency-management
git add frontend/components/accounts/account-form.tsx frontend/components/accounts/__tests__/account-form.spec.tsx
git commit -m "feat: convert account form currency input to dropdown"
```

---

### Task 12: Convert Journal Entry Currency to Dropdown

**Files:**
- Modify: `frontend/components/journal/line-editor.tsx` (or similar)
- Test: `frontend/components/journal/__tests__/line-editor.spec.tsx`

**Step 1: Write the failing test**

```typescript
// frontend/components/journal/__tests__/line-editor.spec.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { LineEditor } from '../line-editor';
import { useCurrencies } from '@/hooks/use-currencies';

jest.mock('@/hooks/use-currencies', () => ({
  useCurrencies: jest.fn(),
}));

describe('LineEditor - Currency Dropdown', () => {
  const mockCurrencies = [
    { code: 'USD', name: 'US Dollar', decimal_places: 2 },
    { code: 'EUR', name: 'Euro', decimal_places: 2 },
  ];

  beforeEach(() => {
    (useCurrencies as jest.Mock).mockReturnValue({
      data: mockCurrencies,
      isLoading: false,
    });
  });

  it('should render currency dropdown for journal lines', () => {
    render(
      <LineEditor
        line={{ account_id: 'acc-1', amount: 100, currency: 'USD' }}
        onChange={jest.fn()}
      />
    );

    const select = screen.getByRole('combobox', { name: /curr/i });
    expect(select).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd /Users/kifuko/dev/multi_currency_accounting/.worktrees/currency-management/frontend
npm test -- --testPathPattern="journal/line-editor.spec.tsx"
```
Expected: FAIL - still uses Input

**Step 3: Write minimal implementation**

```typescript
// frontend/components/journal/line-editor.tsx
import { useCurrencies } from '@/hooks/use-currencies';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Replace currency Input with:
<div>
  <Label>Currency</Label>
  {isLoading ? (
    <Input disabled placeholder="..." />
  ) : (
    <Select
      value={line.currency}
      onValueChange={(value) => onChange({ ...line, currency: value })}
    >
      <SelectTrigger>
        <SelectValue placeholder="Curr" />
      </SelectTrigger>
      <SelectContent>
        {currencies?.map((currency) => (
          <SelectItem key={currency.code} value={currency.code}>
            {currency.code}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )}
</div>
```

**Step 4: Run test to verify it passes**

```bash
cd /Users/kifuko/dev/multi_currency_accounting/.worktrees/currency-management/frontend
npm test -- --testPathPattern="journal/line-editor.spec.tsx"
```
Expected: PASS

**Step 5: Commit**

```bash
cd /Users/kifuko/dev/multi_currency_accounting/.worktrees/currency-management
git add frontend/components/journal/line-editor.tsx
git commit -m "feat: convert journal line currency input to dropdown"
```

---

### Task 13: Make Settings Currency Tab Read-Only

**Files:**
- Modify: `frontend/app/(dashboard)/settings/page.tsx`

**Step 1: Write the failing test**

```typescript
// frontend/app/(dashboard)/settings/__tests__/page.spec.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SettingsPage } from '../page';
import { currenciesApi } from '@/lib/currencies';
import { useSession } from 'next-auth/react';

jest.mock('@/lib/currencies', () => ({
  currenciesApi: {
    getAll: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

describe('SettingsPage - Currency Tab Read-Only', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useSession as jest.Mock).mockReturnValue({ data: { user: { role: 'user' } } });
    (currenciesApi.getAll as jest.Mock).mockResolvedValue([
      { code: 'USD', name: 'US Dollar', symbol: '$' },
    ]);
  });

  it('should NOT show add currency form', () => {
    render(<SettingsPage />);

    // Switch to currencies tab
    fireEvent.click(screen.getByText('Currencies'));

    expect(screen.queryByText('Add New Currency')).not.toBeInTheDocument();
  });

  it('should NOT show delete buttons', () => {
    render(<SettingsPage />);

    fireEvent.click(screen.getByText('Currencies'));

    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
  });

  it('should show admin notice', () => {
    render(<SettingsPage />);

    fireEvent.click(screen.getByText('Currencies'));

    expect(screen.getByText(/contact your admin/i)).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd /Users/kifuko/dev/multi_currency_accounting/.worktrees/currency-management/frontend
npm test -- --testPathPattern="settings/page.spec.tsx"
```
Expected: FAIL - still has add/delete

**Step 3: Write minimal implementation**

```typescript
// frontend/app/(dashboard)/settings/page.tsx

// Remove:
// - newCurrency state
// - handleAddCurrency function
// - handleDeleteCurrency function
// - startEditing, saveEdit, cancelEditing functions

// Replace currency tab content with:
{activeTab === 'currencies' && (
  <div className="space-y-4">
    <Card>
      <CardHeader>
        <CardTitle>Available Currencies</CardTitle>
        <CardDescription>
          Currencies are managed by administrators. Contact your admin to add or modify currencies.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Symbol</TableHead>
              <TableHead>Decimal Places</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currencies.map((currency) => (
              <TableRow key={currency.id}>
                <TableCell className="font-medium">{currency.code}</TableCell>
                <TableCell>{currency.name}</TableCell>
                <TableCell>{currency.symbol || '-'}</TableCell>
                <TableCell>{currency.decimal_places}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>

    {/* Admin-only section */}
    {isAdmin && (
      <Card className="border-primary">
        <CardHeader>
          <CardTitle>Admin: Currency Management</CardTitle>
          <CardDescription>
            As an administrator, you can manage currencies below or in the Admin Panel.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button variant="outline" asChild>
              <Link href="/admin/currencies">
                Open Admin Currency Manager
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )}
  </div>
)}
```

**Step 4: Run test to verify it passes**

```bash
cd /Users/kifuko/dev/multi_currency_accounting/.worktrees/currency-management/frontend
npm test -- --testPathPattern="settings/page.spec.tsx"
```
Expected: PASS

**Step 5: Commit**

```bash
cd /Users/kifuko/dev/multi_currency_accounting/.worktrees/currency-management
git add frontend/app/\(dashboard\)/settings/page.tsx
git commit -m "feat: make settings currency tab read-only for regular users"
```

---

## Phase 4: Integration Testing

### Task 14: Full Integration Test

**Files:**
- Test: `backend/src/comprehensive.tdd.spec.ts`

**Step 1: Write the integration test**

```typescript
describe('Currency System Integration', () => {
  let app: INestApplication;
  let userToken: string;
  let adminToken: string;

  beforeAll(async () => {
    app = module.createNestApplication();
    await app.init();
    // Setup - seed currencies, create users
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Public Access', () => {
    it('should allow any authenticated user to fetch currencies', async () => {
      const response = await request(app.getHttpServer())
        .get('/currencies')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body[0]).toHaveProperty('code');
    });

    it('should reject currency creation via public endpoint', async () => {
      const response = await request(app.getHttpServer())
        .post('/currencies')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ code: 'TEST', name: 'Test' });

      expect(response.status).toBe(404);
    });
  });

  describe('Admin Access', () => {
    it('should allow admin to create currency', async () => {
      const response = await request(app.getHttpServer())
        .post('/admin/currencies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ code: 'AAPL', name: 'Apple Inc.', symbol: '$', decimal_places: 2 });

      expect(response.status).toBe(201);
      expect(response.body.code).toBe('AAPL');
    });

    it('should reject admin endpoints for regular users', async () => {
      const response = await request(app.getHttpServer())
        .post('/admin/currencies')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ code: 'TEST', name: 'Test' });

      expect(response.status).toBe(403);
    });
  });

  describe('Seed Functionality', () => {
    it('should seed 14 default currencies', async () => {
      // Clean slate - delete all currencies first
      // Then seed
      const response = await request(app.getHttpServer())
        .post('/admin/currencies/seed')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      
      // Verify 14 currencies exist
      const listResponse = await request(app.getHttpServer())
        .get('/currencies')
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(listResponse.body).toHaveLength(14);
    });

    it('should be idempotent', async () => {
      await request(app.getHttpServer())
        .post('/admin/currencies/seed')
        .set('Authorization', `Bearer ${adminToken}`);

      const response = await request(app.getHttpServer())
        .post('/admin/currencies/seed')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
    });
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd /Users/kifuko/dev/multi_currency_accounting/.worktrees/currency-management/backend
npm test -- --testPathPattern="comprehensive.tdd.spec.ts"
```
Expected: FAIL - integration tests may need adjustment

**Step 3: Run all tests**

```bash
cd /Users/kifuko/dev/multi_currency_accounting/.worktrees/currency-management/backend
npm test
```
Expected: All backend tests pass (138+)

**Step 4: Commit**

```bash
cd /Users/kifuko/dev/multi_currency_accounting/.worktrees/currency-management
git add backend/src/comprehensive.tdd.spec.ts
git commit -m "test: add currency system integration tests"
```

---

## Summary

| Task | Description | Files Modified |
|------|-------------|----------------|
| 1 | CurrenciesController read-only | `currencies.controller.ts` |
| 2 | validateCurrencyExists method | `currencies.service.ts` |
| 3 | Idempotent seed logic | `currencies.service.ts` |
| 4 | Admin currency CRUD | `admin.controller.ts`, `admin.service.ts` |
| 5 | Currency validation in journal | `journal.service.ts` |
| 6 | Currency validation in accounts | `accounts.service.ts` |
| 7 | use-currencies hook | `hooks/use-currencies.ts` |
| 8 | admin-currencies API client | `lib/admin-currencies.ts` |
| 9 | Admin currency page | `app/(admin)/currencies/page.tsx` |
| 10 | Admin nav currencies link | `app/(admin)/layout.tsx` |
| 11 | Account form dropdown | `components/accounts/account-form.tsx` |
| 12 | Journal line dropdown | `components/journal/line-editor.tsx` |
| 13 | Settings read-only | `app/(dashboard)/settings/page.tsx` |
| 14 | Integration tests | `comprehensive.tdd.spec.ts` |

**Total Tasks:** 14
**Estimated Time:** 8-11 hours

---

**Plan complete and saved to `docs/plans/2026-01-20-currency-management-implementation.md`. Two execution options:**

1. **Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration
2. **Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

Which approach?
