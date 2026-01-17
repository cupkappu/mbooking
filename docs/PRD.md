# Multi-Currency Personal Accounting Software PRD

**版本:** alpha0.1  
**日期:** 2026-01-17  
**状态:** 初稿

---

## 1. 项目概述

### 1.1 产品愿景

开发一款具备完整功能、美观的个人复式记账软件，支持多账户、多货币记账，满足有多货币资产管理需求的个人用户。

### 1.2 核心价值主张

- **复式记账**: 支持基于五大账户类别（资产、负债、权益、收入、支出）的复式记账，而非线性单账户记账
- **多货币支持**: 原生支持多货币账户、汇率转换、汇率历史追踪
- **美观易用**: Next.js 前端 + Tailwind CSS + shadcn/ui，提供现代化用户体验
- **可扩展**: Provider 插件系统支持扩展汇率数据源
- **数据主权**: 自托管部署，数据完全由用户控制

### 1.3 目标用户

使用多货币、有管理多个账户需求的用户，包括：
- 银行账户（多币种）
- 投资账户（股票、基金、债券）
- 虚拟货币钱包
- 现金（多币种）
- 经常旅行或跨境消费人士

---

## 2. 技术架构

### 2.1 技术栈

| 层级 | 技术选择 | 说明 |
|------|---------|------|
| **前端框架** | Next.js 14+ (App Router) | React 全栈框架，支持服务端渲染 |
| **前端UI** | Tailwind CSS + shadcn/ui | 现代、简洁、可定制 |
| **后端框架** | NestJS 10+ | Node.js 企业级框架，TypeORM 官方支持 |
| **数据库** | PostgreSQL 15+ | 主数据库 |
| **ORM** | TypeORM | NestJS 官方推荐 ORM |
| **认证** | Auth.js (NextAuth) | 支持多种认证 provider |
| **部署** | Docker Compose | 本地开发与生产部署 |
| **API 风格** | REST + JSON Body | 复杂查询通过 JSON Body 传递 |

### 2.2 系统架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                        用户浏览器                                │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Next.js 前端 (Port 3000)                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │  登录页      │  │  Dashboard  │  │  账户管理    │            │
│  │  /login    │  │  /dashboard │  │  /accounts  │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │ 日记账      │  │  报表页      │  │  设置页      │            │
│  │ /journal   │  │  /reports   │  │  /settings  │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                     NestJS 后端 (Port 3001)                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    API Gateway / Controller              │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │ 认证模块     │  │ 查询引擎    │  │ 汇率引擎     │            │
│  │ Auth Module │  │ Query Engine│  │ Rate Engine │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
│  ┌─────────────┐  ┌─────────────┐                              │
│  │ Provider    │  │ 定时任务     │                              │
│  │ Plugin System│  │ Scheduler   │                              │
│  └─────────────┘  └─────────────┘                              │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PostgreSQL (Port 5432)                       │
│  ┌───────────────────┐  ┌───────────────────────────────────┐  │
│  │  public schema    │  │  per_tenant schemas (RLS enabled) │  │
│  │  - currencies     │  │  - accounts                       │  │
│  │  - providers      │  │  - journal_entries                │  │
│  │  - exchange_rates │  │  - budgets                        │  │
│  └───────────────────┘  │  - reports                        │  │
│                         └───────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Provider Plugins (本地/远程)                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  JS Plugins (本地)  │  REST API Providers (远程)         │   │
│  │  ./plugins/js/*    │  configured via API                 │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 2.3 目录结构

```
multi_currency_accounting/
├── frontend/                    # Next.js 前端
│   ├── app/                     # App Router
│   │   ├── (auth)/             # 认证相关页面
│   │   │   ├── login/
│   │   │   └── callback/
│   │   ├── (dashboard)/        # 主应用
│   │   │   ├── dashboard/
│   │   │   ├── accounts/
│   │   │   ├── journal/
│   │   │   ├── reports/
│   │   │   ├── settings/
│   │   │   └── layout.tsx
│   │   ├── api/                # Next.js API Routes (代理到后端)
│   │   └── globals.css
│   ├── components/             # React 组件
│   │   ├── ui/                 # shadcn/ui 组件
│   │   ├── accounts/
│   │   ├── journal/
│   │   └── reports/
│   ├── lib/                    # 工具函数
│   ├── hooks/                  # 自定义 Hooks
│   └── types/                  # TypeScript 类型定义
│
├── backend/                    # NestJS 后端
│   ├── src/
│   │   ├── auth/              # 认证模块
│   │   ├── accounts/          # 账户模块
│   │   ├── journal/           # 日记账模块
│   │   ├── query/             # 查询引擎模块
│   │   ├── rates/             # 汇率引擎模块
│   │   ├── providers/         # Provider 插件系统
│   │   ├── scheduler/         # 定时任务模块
│   │   ├── common/            # 公共模块
│   │   └── app.module.ts
│   ├── plugins/               # JS Provider 插件目录
│   │   └── js/
│   └── test/                  # 测试文件
│
├── shared/                     # 共享类型定义
│   └── types/
│
├── database/
│   ├── migrations/            # TypeORM migrations
│   └── seeders/               # 数据库种子数据
│
├── docker-compose.yml         # Docker Compose 配置
├── Dockerfile.frontend
├── Dockerfile.backend
├── package.json
├── tsconfig.json
└── README.md
```

---

## 3. 数据模型设计

### 3.1 实体关系图

```
┌─────────────────────────────────────────────────────────────────┐
│                        全局表 (非租户隔离)                       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────┐
│    currencies   │  ◄─── 货币定义（USD, HKD, CNY, BTC, etc.）
└─────────────────┘
         │
         ▼
┌─────────────────┐
│    providers    │  ◄─── Provider 配置（汇率数据源）
└─────────────────┘
         │
         ▼
┌─────────────────┐
│  exchange_rates │  ◄─── 汇率历史（每日记录）
└─────────────────┘
         │
         │  ┌─────────────────────────────────────────────────────┐
         │  │                   租户隔离表                         │
         └  └─────────────────────────────────────────────────────┘
         ▼
┌─────────────────────────────────────────────────────────────────┐
│  tenants (租户/用户)                                            │
│  - id                                                            │
│  - user_id (关联 auth.js 用户)                                  │
│  - name                                                          │
│  - settings (JSON: default_currency, timezone, etc.)            │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│  accounts (账户 - 无限嵌套树状结构)                              │
│  - id                                                            │
│  - tenant_id                                                     │
│  - parent_id (可空，顶层账户)                                    │
│  - name                                                          │
│  - type (assets/liabilities/equity/revenue/expense)             │
│  - currency (默认货币)                                           │
│  - path (计算属性: assets:bank:checking)                        │
│  - depth (计算属性: 层级深度)                                    │
│  - balance (计算属性: 当前余额)                                  │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│  journal_entries (日记账 - 复式记账核心)                         │
│  - id                                                            │
│  - tenant_id                                                     │
│  - date (交易时间戳)                                             │
│  - description (描述)                                            │
│  - reference_id (外部引用，如银行流水号)                          │
│  - created_at                                                    │
│  - updated_at                                                    │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│  journal_lines (日记账分录 - 一笔交易多条分录)                    │
│  - id                                                            │
│  - journal_entry_id                                              │
│  - tenant_id                                                     │
│  - account_id                                                    │
│  - amount (金额，正负表示借贷方向)                                │
│  - currency                                                      │
│  - exchange_rate (如果与账户默认货币不同)                         │
│  - converted_amount (转换后的金额)                               │
│  - tags (JSON: ["food", "lunch"])                               │
│  - remarks (备注)                                                │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│  budgets (预算)                                                  │
│  - id                                                            │
│  - tenant_id                                                     │
│  - account_id (预算针对的账户，可为空表示顶层)                    │
│  - name                                                          │
│  - type (periodic/non-periodic)                                 │
│  - amount (预算金额)                                             │
│  - currency                                                      │
│  - start_date                                                    │
│  - end_date (可空，无终止日期)                                   │
│  - period_type (monthly/weekly/yearly - 仅周期性)               │
│  - created_at                                                    │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│  reports (报表)                                                  │
│  - id                                                            │
│  - tenant_id                                                     │
│  - type (balance_sheet/income_statement/cash_flow)              │
│  - title                                                         │
│  - content (JSON: 报表数据)                                      │
│  - generated_at                                                  │
│  - date_range (JSON: { from, to })                              │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 详细字段定义

#### 3.2.1 currencies (货币)

```typescript
interface Currency {
  code: string;        // 主键: USD, HKD, CNY, BTC, ETH
  name: string;        // 美元, 港币, 人民币, 比特币
  symbol: string;      // $, HK$, ¥, ₿
  decimal_places: number;  // 小数位数 (2 或 8 for crypto)
  is_active: boolean;
  created_at: Date;
}
```

#### 3.2.2 providers (汇率 Provider 配置)

```typescript
interface Provider {
  id: string;
  name: string;              // 显示名称
  type: 'js_plugin' | 'rest_api';  // 类型
  config: {                  // 配置（JSON）
    // JS Plugin 类型
    file_path?: string;      // 插件文件路径
    // REST API 类型
    base_url?: string;       // API 基础 URL
    api_key?: string;        // API Key（加密存储）
    headers?: Record<string, string>;
  };
  supported_currencies: string[];  // 支持的货币列表
  supports_historical: boolean;    // 是否支持历史汇率查询
  supports_date_query: boolean;    // 是否支持指定日期查询
  record_history: boolean;         // 是否自动记录汇率历史
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}
```

#### 3.2.3 exchange_rates (汇率历史)

```typescript
interface ExchangeRate {
  id: string;
  provider_id: string;       // 来源 Provider
  from_currency: string;     // 源货币
  to_currency: string;       // 目标货币
  rate: number;              // 汇率值
  date: Date;                // 日期（每日的记录）
  fetched_at: Date;          // 抓取时间
}
```

#### 3.2.4 accounts (账户 - 树状结构)

```typescript
interface Account {
  id: string;
  tenant_id: string;
  parent_id: string | null;  // 可空，顶层账户
  name: string;              // 账户名称
  type: 'assets' | 'liabilities' | 'equity' | 'revenue' | 'expense';
  currency: string;          // 默认货币
  path: string;              // 计算属性: assets:bank:checking
  depth: number;             // 计算属性: 3
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}
```

**账户路径示例：**
```
assets (depth=0)
├── bank (depth=1)
│   ├── checking (depth=2)
│   └── savings (depth=2)
└── investment (depth=1)
    └── brokerage (depth=2)

expense (depth=0)
├── food (depth=1)
│   ├── snack (depth=2)
│   └── restaurant (depth=2)
└── transport (depth=1)
```

#### 3.2.5 journal_entries (日记账主表)

```typescript
interface JournalEntry {
  id: string;
  tenant_id: string;
  date: Date;                // 交易时间
  description: string;       // 描述
  reference_id?: string;     // 外部引用 ID
  is_pending: boolean;       // 是否待确认
  created_by: string;        // 创建用户
  created_at: Date;
  updated_at: Date;
}
```

#### 3.2.6 journal_lines (日记账分录)

```typescript
interface JournalLine {
  id: string;
  journal_entry_id: string;
  tenant_id: string;
  account_id: string;        // 借贷账户
  amount: number;            // 金额（正数或负数）
  currency: string;          // 原始货币
  exchange_rate?: number;    // 汇率（如果需要转换）
  converted_amount?: number; // 转换后的金额
  tags: string[];            // 标签
  remarks?: string;          // 备注
  created_at: Date;
}
```

**复式记账示例：**
```
交易: 在香港便利店买午餐，花费 50 HKD

日记账:
┌─────────────────────────────────────────────┐
│ 日期: 2025-01-15                            │
│ 描述: 7-11 便利店午餐                        │
├─────────────────────────────────────────────┤
│ 账户            | 金额       | 货币          │
├─────────────────────────────────────────────┤
│ expense:food    | -50.00     | HKD          │
│ assets:cash     | +50.00     | HKD          │
├─────────────────────────────────────────────┤
│ 借贷平衡        | 0.00       |              │
└─────────────────────────────────────────────┘
```

#### 3.2.7 budgets (预算)

```typescript
interface Budget {
  id: string;
  tenant_id: string;
  account_id?: string;       // 可空，表示对顶层账户的预算
  name: string;
  type: 'periodic' | 'non_periodic';
  amount: number;
  currency: string;
  // 周期性预算
  period_type?: 'monthly' | 'weekly' | 'yearly';
  start_date: Date;
  end_date?: Date;           // 可空，无终止日期
  // 非周期性预算
  is_single_transaction?: boolean;
  // 追踪
  spent_amount: number;      // 已花费
  spent_currency: string;
  alert_threshold?: number;  // 警报阈值（如 80%）
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}
```

#### 3.2.8 reports (报表)

```typescript
interface Report {
  id: string;
  tenant_id: string;
  type: 'balance_sheet' | 'income_statement' | 'cash_flow';
  title: string;
  content: JSON;             // 报表数据
  generated_at: Date;
  date_range: {
    from: Date;
    to: Date;
  };
}
```

### 3.3 租户隔离策略

所有租户隔离表必须启用 RLS（行级安全）：

```sql
-- 启用 RLS
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- 创建策略
CREATE POLICY "Tenant isolation for accounts"
  ON accounts FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id')::text);

-- 在应用中设置租户上下文
-- NestJS 拦截器在每个请求中设置 current_setting('app.current_tenant_id')
```

**全局表（不启用 RLS）：**
- `currencies`
- `providers`
- `exchange_rates`

---

## 4. API 设计规范

### 4.1 API 风格

- **风格**: REST + JSON Body
- **基础路径**: `/api/v1`
- **Content-Type**: `application/json`
- **认证**: Bearer Token (JWT from Auth.js)
- **分页**: 支持 `offset` + `limit` 或 `cursor`

### 4.2 通用响应格式

```typescript
// 成功响应
interface SuccessResponse<T> {
  success: true;
  data: T;
  meta?: {
    pagination?: {
      offset: number;
      limit: number;
      total: number;
      has_more: boolean;
    };
    cache_hit?: boolean;
  };
}

// 错误响应
interface ErrorResponse {
  success: false;
  error: {
    code: string;      // ERROR_AUTH_INVALID, ERROR_VALIDATION_FAILED
    message: string;
    details?: any;
  };
}
```

### 4.3 查询引擎 API

#### 4.3.1 账户余额查询

**POST** `/api/v1/query/balances`

**请求体:**
```typescript
interface BalancesQueryRequest {
  // 日期范围
  date_range?: {
    from: string;  // ISO 8601 Date
    to: string;
  };
  
  // 深度控制
  depth?: 1 | 2 | 3 | 'all';  // 默认 1
  
  // 账户过滤
  account_filter?: {
    types?: ('assets' | 'liabilities' | 'equity' | 'revenue' | 'expense')[];
    paths?: string[];        // 如 ['expense:food:*']
    depth?: number;          // 筛选特定深度的账户
  };
  
  // 货币转换
  convert_to?: string;       // 目标货币，如 'USD'
  exchange_rate_date?: 'latest' | 'query_date' | 'specific_date';
  specific_date?: string;    // 指定日期获取历史汇率
  
  // 分页（渐进式加载）
  pagination?: {
    offset?: number;         // 默认 0
    limit?: number;          // 默认 50，最大 100
  };
  
  // 缓存控制
  use_cache?: boolean;       // 默认 true
}
```

**响应:**
```typescript
interface BalancesQueryResponse {
  balances: Array<{
    account: {
      id: string;
      path: string;
      name: string;
      type: string;
      depth: number;
    };
    currencies: Array<{
      currency: string;
      amount: number;
    }>;
    converted_amount?: number;  // 如果指定了 convert_to
  }>;
  pagination: {
    offset: number;
    limit: number;
    total: number;
    has_more: boolean;
  };
  meta: {
    convert_to?: string;
    exchange_rate_date?: string;
    cache_hit: boolean;
    calculated_at: string;
  };
}
```

**示例请求:**
```json
{
  "date_range": {
    "from": "2025-01-01",
    "to": "2025-12-31"
  },
  "depth": 1,
  "convert_to": "USD",
  "exchange_rate_date": "specific_date",
  "specific_date": "2025-06-30",
  "pagination": {
    "offset": 0,
    "limit": 50
  }
}
```

**示例响应:**
```json
{
  "success": true,
  "data": {
    "balances": [
      {
        "account": {
          "id": "uuid-1",
          "path": "assets",
          "name": "Assets",
          "type": "assets",
          "depth": 1
        },
        "currencies": [
          { "currency": "HKD", "amount": 48850.00 },
          { "currency": "CNY", "amount": 33277.00 }
        ],
        "converted_amount": 81850.00
      },
      {
        "account": {
          "id": "uuid-2",
          "path": "liabilities",
          "name": "Liabilities",
          "type": "liabilities",
          "depth": 1
        },
        "currencies": [
          { "currency": "HKD", "amount": -105.00 }
        ],
        "converted_amount": -105.00
      }
    ],
    "pagination": {
      "offset": 0,
      "limit": 50,
      "total": 5,
      "has_more": true
    }
  },
  "meta": {
    "convert_to": "USD",
    "exchange_rate_date": "2025-06-30",
    "cache_hit": true,
    "calculated_at": "2025-01-17T10:30:00Z"
  }
}
```

#### 4.3.2 日记账查询

**POST** `/api/v1/query/journal-entries`

**请求体:**
```typescript
interface JournalQueryRequest {
  // 日期范围
  date_range?: {
    from: string;
    to: string;
  };
  
  // 账户过滤
  account_filter?: {
    paths?: string[];
    types?: string[];
    include_children?: boolean;  // 是否包含子账户
  };
  
  // 金额过滤
  amount_filter?: {
    min?: number;
    max?: number;
    currency?: string;
  };
  
  // 标签过滤
  tags?: string[];
  
  // 搜索
  search?: string;              // 搜索描述
  
  // 排序
  sort?: {
    field: 'date' | 'amount' | 'created_at';
    order: 'asc' | 'desc';
  };
  
  // 分页
  pagination?: {
    offset?: number;
    limit?: number;
  };
  
  use_cache?: boolean;
}
```

**响应:**
```typescript
interface JournalQueryResponse {
  entries: Array<{
    id: string;
    date: string;
    description: string;
    reference_id?: string;
    lines: Array<{
      account: {
        id: string;
        path: string;
        name: string;
      };
      amount: number;
      currency: string;
      converted_amount?: number;
      tags: string[];
      remarks?: string;
    }>;
  }>;
  pagination: {
    offset: number;
    limit: number;
    total: number;
    has_more: boolean;
  };
  meta: {
    cache_hit: boolean;
  };
}
```

#### 4.3.3 报表生成

**POST** `/api/v1/query/reports/balance-sheet`

**请求体:**
```typescript
interface BalanceSheetRequest {
  as_of_date: string;          // 报表日期
  depth?: number;              // 账户深度
  convert_to?: string;         // 目标货币
  exchange_rate_date?: 'latest' | 'as_of_date';
}
```

**响应:**
```typescript
interface BalanceSheetResponse {
  report: {
    title: string;
    as_of_date: string;
    generated_at: string;
    sections: {
      assets: Array<{
        path: string;
        name: string;
        amount: number;
        currency: string;
        children?: any[];
      }>;
      liabilities: any[];
      equity: any[];
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

### 4.4 账户管理 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/accounts` | 获取账户列表（树状结构） |
| POST | `/api/v1/accounts` | 创建账户 |
| GET | `/api/v1/accounts/:id` | 获取单个账户 |
| PUT | `/api/v1/accounts/:id` | 更新账户 |
| DELETE | `/api/v1/accounts/:id` | 删除账户（需无子账户和无交易） |
| POST | `/api/v1/accounts/move` | 移动账户（变更父账户） |

#### 创建账户请求示例

**POST** `/api/v1/accounts`

```json
{
  "name": "Checking Account",
  "type": "assets",
  "parent_id": "uuid-of-bank",  // 可空（顶层账户）
  "currency": "HKD"
}
```

### 4.5 日记账 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/journal` | 获取日记账列表 |
| POST | `/api/v1/journal` | 创建日记账（支持多行分录） |
| GET | `/api/v1/journal/:id` | 获取单个日记账 |
| PUT | `/api/v1/journal/:id` | 更新日记账 |
| DELETE | `/api/v1/journal/:id` | 删除日记账 |

#### 创建日记账请求示例

**POST** `/api/v1/journal`

```json
{
  "date": "2025-01-15T12:00:00Z",
  "description": "7-11 便利店午餐",
  "lines": [
    {
      "account_path": "expense:food",
      "amount": -50,
      "currency": "HKD",
      "tags": ["food", "lunch"],
      "remarks": "叉烧饭"
    },
    {
      "account_path": "assets:cash",
      "amount": 50,
      "currency": "HKD"
    }
  ]
}
```

### 4.6 汇率引擎 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/rates/latest` | 获取最新汇率 |
| GET | `/api/v1/rates/history` | 获取汇率历史 |
| GET | `/api/v1/rates/convert` | 货币转换计算 |
| GET | `/api/v1/rates/providers` | 获取 Provider 列表 |
| POST | `/api/v1/rates/providers` | 创建 Provider 配置 |
| PUT | `/api/v1/rates/providers/:id` | 更新 Provider |
| POST | `/api/v1/rates/fetch` | 手动触发汇率获取 |

#### 获取最新汇率

**GET** `/api/v1/rates/latest?from=USD&to=HKD,CNY`

```json
{
  "success": true,
  "data": {
    "timestamp": "2025-01-17T10:00:00Z",
    "rates": [
      { "from": "USD", "to": "HKD", "rate": 7.7850 },
      { "from": "USD", "to": "CNY", "rate": 7.2450 }
    ]
  }
}
```

#### 货币转换

**GET** `/api/v1/rates/convert?amount=100&from=HKD&to=USD&date=2025-01-15`

```json
{
  "success": true,
  "data": {
    "amount": 100,
    "from": "HKD",
    "to": "USD",
    "converted_amount": 12.844,
    "rate": 7.785,
    "date": "2025-01-15",
    "source": "historical"
  }
}
```

### 4.7 Provider 管理 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/providers` | 获取 Provider 列表 |
| POST | `/api/v1/providers` | 创建 Provider |
| GET | `/api/v1/providers/:id` | 获取 Provider 详情 |
| PUT | `/api/v1/providers/:id` | 更新 Provider |
| DELETE | `/api/v1/providers/:id` | 删除 Provider |
| POST | `/api/v1/providers/:id/test` | 测试 Provider 连接 |

#### 创建 JS Plugin Provider

**POST** `/api/v1/providers`

```json
{
  "name": "Custom Exchange Rate API",
  "type": "js_plugin",
  "config": {
    "file_path": "./plugins/js/my-provider.js"
  },
  "supported_currencies": ["USD", "EUR", "GBP", "JPY"],
  "supports_historical": true,
  "supports_date_query": true,
  "record_history": true,
  "is_active": true
}
```

#### 创建 REST API Provider

**POST** `/api/v1/providers`

```json
{
  "name": "Exchangerate.host",
  "type": "rest_api",
  "config": {
    "base_url": "https://api.exchangerate.host",
    "headers": {
      "Accept": "application/json"
    }
  },
  "supported_currencies": ["USD", "EUR", "GBP", "JPY", "CNY", "HKD"],
  "supports_historical": true,
  "supports_date_query": true,
  "record_history": true,
  "is_active": true
}
```

### 4.8 预算管理 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/budgets` | 获取预算列表 |
| POST | `/api/v1/budgets` | 创建预算 |
| GET | `/api/v1/budgets/:id` | 获取预算详情 |
| PUT | `/api/v1/budgets/:id` | 更新预算 |
| DELETE | `/api/v1/budgets/:id` | 删除预算 |
| GET | `/api/v1/budgets/:id/progress` | 获取预算进度 |

#### 创建周期性预算

**POST** `/api/v1/budgets`

```json
{
  "name": "餐饮预算",
  "type": "periodic",
  "account_path": "expense:food",
  "amount": 5000,
  "currency": "HKD",
  "period_type": "monthly",
  "start_date": "2025-01-01",
  "end_date": "2025-12-31",
  "alert_threshold": 0.8
}
```

#### 创建非周期性预算

**POST** `/api/v1/budgets`

```json
{
  "name": "购买新电脑",
  "type": "non_periodic",
  "account_path": "expense:electronics",
  "amount": 15000,
  "currency": "HKD",
  "is_single_transaction": false,
  "start_date": "2025-01-01",
  "alert_threshold": 0.9
}
```

### 4.9 认证 API

认证通过 Auth.js 处理，前端使用 NextAuth.js，后端验证 JWT Token。

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/callback/[provider]` | OAuth 回调 |
| GET | `/api/auth/session` | 获取 session |
| POST | `/api/auth/logout` | 登出 |

**Authelia Header 认证：**
- Authelia 在反向代理层处理认证
- 通过 HTTP Header 传递用户信息（如 `X-Auth-User`）
- NestJS 中间件验证 Header 并设置用户上下文

---

## 5. Provider 插件系统

### 5.1 架构设计

```
┌─────────────────────────────────────────────────────────────────┐
│                    Rate Engine (汇率引擎)                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │  Scheduler  │  │  Rate Store │  │  Provider Loader        │ │
│  │  (定时任务)  │  │  (汇率存储)  │  │  (插件加载器)           │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
│                           │                                      │
│            ┌──────────────┼──────────────┐                      │
│            ▼              ▼              ▼                      │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │  JS Plugin      │ │  REST API       │ │  Base Provider  │   │
│  │  (本地文件)      │ │  (远程配置)      │ │  (内置)         │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Provider 接口定义

所有 Provider 必须实现以下接口：

```typescript
interface RateProvider {
  // Provider 标识
  readonly id: string;
  readonly name: string;
  readonly version: string;
  
  // 支持的货币
  readonly supportedCurrencies: string[];
  
  // 功能支持
  readonly supportsHistorical: boolean;
  readonly supportsDateQuery: boolean;
  
  // 获取最新汇率
  getLatestRate(from: string, to: string): Promise<RateResult>;
  
  // 获取指定日期汇率
  getRateAtDate(from: string, to: string, date: Date): Promise<RateResult>;
  
  // 获取所有支持货币对当前货币的汇率
  getAllRates(baseCurrency: string): Promise<Map<string, number>>;
  
  // 测试连接
  testConnection(): Promise<boolean>;
  
  // 销毁
  destroy(): void;
}

interface RateResult {
  from: string;
  to: string;
  rate: number;
  timestamp: Date;
  source: string;
}
```

### 5.3 JS Plugin 开发规范

**文件结构：**
```
backend/plugins/js/
├── providers/
│   ├── exchangerate-host.js
│   ├── coinbase.js
│   └── custom-provider.js
└── index.js  # 插件注册入口
```

**Plugin 模板：**
```javascript
// backend/plugins/js/my-provider.js

class MyRateProvider {
  constructor(config) {
    this.config = config;
    this.id = 'my-provider';
    this.name = 'My Exchange Rate Provider';
    this.version = '1.0.0';
    this.supportedCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CNY', 'HKD'];
    this.supportsHistorical = true;
    this.supportsDateQuery = true;
  }

  async getLatestRate(from, to) {
    // 实现获取最新汇率的逻辑
    const response = await fetch(
      `${this.config.base_url}/latest?base=${from}&symbols=${to}`
    );
    const data = await response.json();
    
    return {
      from,
      to,
      rate: data.rates[to],
      timestamp: new Date(),
      source: this.name
    };
  }

  async getRateAtDate(from, to, date) {
    // 实现获取历史汇率的逻辑
    const dateStr = date.toISOString().split('T')[0];
    const response = await fetch(
      `${this.config.base_url}/${dateStr}?base=${from}&symbols=${to}`
    );
    const data = await response.json();
    
    return {
      from,
      to,
      rate: data.rates[to],
      timestamp: date,
      source: this.name
    };
  }

  async getAllRates(baseCurrency) {
    const response = await fetch(
      `${this.config.base_url}/latest?base=${baseCurrency}`
    );
    const data = await response.json();
    
    const rates = new Map();
    for (const [currency, rate] of Object.entries(data.rates)) {
      rates.set(currency, rate);
    }
    
    return rates;
  }

  async testConnection() {
    try {
      await this.getLatestRate('USD', 'EUR');
      return true;
    } catch {
      return false;
    }
  }

  destroy() {
    // 清理资源
  }
}

// 导出插件工厂函数
module.exports = (config) => new MyRateProvider(config);
```

### 5.4 REST API Provider 配置

对于 REST API Provider，无需编写代码，通过配置即可：

```json
{
  "name": "Exchangerate.host",
  "type": "rest_api",
  "config": {
    "base_url": "https://api.exchangerate.host",
    "endpoints": {
      "latest": "/latest",
      "historical": "/{date}"
    },
    "response_mapping": {
      "rate": "rates.{to}",
      "timestamp": "date"
    },
    "headers": {}
  },
  "supported_currencies": ["USD", "EUR", "GBP", "JPY", "CNY", "HKD"],
  "supports_historical": true,
  "supports_date_query": true,
  "record_history": true
}
```

### 5.5 插件加载机制

```typescript
// ProviderLoader.ts
class ProviderLoader {
  private plugins: Map<string, RateProvider> = new Map();

  async loadProvider(providerConfig: Provider): Promise<RateProvider> {
    if (providerConfig.type === 'js_plugin') {
      return this.loadJsPlugin(providerConfig);
    } else if (providerConfig.type === 'rest_api') {
      return this.loadRestApi(providerConfig);
    }
  }

  private async loadJsPlugin(config: Provider): Promise<RateProvider> {
    const modulePath = path.resolve(
      process.cwd(),
      'plugins/js',
      config.config.file_path
    );
    
    const module = require(modulePath);
    const factory = module.default || module;
    
    const provider = factory(config.config);
    await provider.testConnection();
    
    this.plugins.set(config.id, provider);
    return provider;
  }

  private loadRestApi(config: Provider): RESTApiProvider {
    return new RESTApiProvider(config);
  }
}
```

### 5.6 汇率获取调度

```typescript
// Scheduler Service
@Injectable()
export class SchedulerService {
  @Interval(3600000)  // 每小时执行
  async fetchLatestRates() {
    const providers = await this.providerService.getActiveProviders();
    
    for (const provider of providers) {
      const currencies = await this.currencyService.getActiveCurrencies();
      const baseCurrency = await this.tenantService.getDefaultCurrency();
      
      for (const currency of currencies) {
        if (currency.code === baseCurrency) continue;
        
        try {
          const rate = await provider.getLatestRate(baseCurrency, currency.code);
          await this.rateService.saveRate(rate, provider.id);
        } catch (error) {
          console.error(`Failed to fetch rate from ${provider.name}:`, error);
        }
      }
    }
  }
}
```

---

## 6. 前端架构

### 6.1 页面结构

```
frontend/app/
├── (auth)/                   # 认证路由组
│   ├── login/
│   │   └── page.tsx          # 登录页
│   └── layout.tsx            # 认证布局
│
├── (dashboard)/              # 主应用路由组
│   ├── dashboard/
│   │   └── page.tsx          # 仪表盘首页
│   ├── accounts/
│   │   ├── page.tsx          # 账户列表
│   │   ├── [id]/             # 账户详情
│   │   │   └── page.tsx
│   │   └── new/
│   │       └── page.tsx      # 创建账户
│   ├── journal/
│   │   ├── page.tsx          # 日记账列表
│   │   ├── new/
│   │   │   └── page.tsx      # 创建日记账
│   │   └── [id]/
│   │       └── page.tsx      # 日记账详情
│   ├── reports/
│   │   ├── page.tsx          # 报表列表
│   │   ├── balance-sheet/
│   │   │   └── page.tsx      # 资产负债表
│   │   └── income-statement/
│   │       └── page.tsx      # 损益表
│   ├── settings/
│   │   ├── page.tsx          # 设置页
│   │   ├── currencies/
│   │   │   └── page.tsx      # 货币管理
│   │   └── providers/
│   │       └── page.tsx      # Provider 管理
│   └── layout.tsx            # 主应用布局（含导航栏）
│
├── api/                      # Next.js API Routes
│   └── [...nextauth]/        # NextAuth.js 处理
│
└── globals.css               # 全局样式
```

### 6.2 核心组件

```
frontend/components/
├── ui/                       # shadcn/ui 基础组件
│   ├── button/
│   ├── card/
│   ├── dialog/
│   ├── table/
│   ├── form/
│   ├── input/
│   ├── select/
│   ├── tabs/
│   └── ...
│
├── layout/                   # 布局组件
│   ├── sidebar/
│   ├── header/
│   └── footer/
│
├── accounts/                 # 账户相关
│   ├── account-tree/
│   ├── account-card/
│   ├── account-form/
│   └── balance-display/
│
├── journal/                  # 日记账相关
│   ├── journal-entry-list/
│   ├── journal-entry-form/
│   ├── line-editor/
│   ├── tag-input/
│   └── amount-input/
│
├── reports/                  # 报表相关
│   ├── balance-sheet/
│   ├── income-statement/
│   ├── chart/
│   └── export-button/
│
├── rates/                    # 汇率相关
│   ├── rate-display/
│   ├── rate-chart/
│   └── currency-selector/
│
├── budgets/                  # 预算相关
│   ├── budget-card/
│   ├── progress-bar/
│   └── budget-form/
│
└── common/                   # 公共组件
    ├── date-picker/
    ├── currency-input/
    └── loading-spinner/
```

### 6.3 状态管理

```typescript
// 使用 React Query (TanStack Query) 进行服务器状态管理
// lib/query-client.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,  // 5 分钟
      gcTime: 30 * 60 * 1000,    // 30 分钟
      retry: 1,
    },
  },
});

// hooks/use-accounts.ts
export function useAccounts(depth?: number) {
  return useQuery({
    queryKey: ['accounts', { depth }],
    queryFn: () => accountsApi.list({ depth }),
  });
}

// hooks/use-journal-entries.ts
export function useJournalEntries(params: JournalQueryParams) {
  return useInfiniteQuery({
    queryKey: ['journal-entries', params],
    queryFn: ({ pageParam = 0 }) => 
      journalApi.list({ ...params, offset: pageParam }),
    getNextPageParam: (lastPage) => 
      lastPage.meta.pagination.has_more 
        ? lastPage.meta.pagination.offset + lastPage.meta.pagination.limit
        : undefined,
  });
}
```

### 6.4 API 客户端

```typescript
// lib/api-client.ts
class ApiClient {
  private baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  private headers = {
    'Content-Type': 'application/json',
  };

  setAuthToken(token: string) {
    this.headers['Authorization'] = `Bearer ${token}`;
  }

  async request<T>(
    method: string,
    endpoint: string,
    body?: object
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}/api/v1${endpoint}`, {
      method,
      headers: this.headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(data.error);
    }

    return data.data;
  }

  // 便捷方法
  async get<T>(endpoint: string) {
    return this.request<T>('GET', endpoint);
  }

  async post<T>(endpoint: string, body: object) {
    return this.request<T>('POST', endpoint, body);
  }

  async put<T>(endpoint: string, body: object) {
    return this.request<T>('PUT', endpoint, body);
  }

  async delete<T>(endpoint: string) {
    return this.request<T>('DELETE', endpoint);
  }
}

export const apiClient = new ApiClient();
```

### 6.5 页面设计

#### 6.5.1 登录页 (Login Page)

```
┌─────────────────────────────────────────────────────────────────┐
│                     Multi-Currency Accounting                    │
│                                                                 │
│                      ┌───────────────────┐                      │
│                      │   欢迎回来         │                      │
│                      └───────────────────┘                      │
│                                                                 │
│                      ┌───────────────────┐                      │
│                      │  邮箱              │                      │
│                      └───────────────────┘                      │
│                                                                 │
│                      ┌───────────────────┐                      │
│                      │  密码              │                      │
│                      └───────────────────┘                      │
│                                                                 │
│                      ┌───────────────────┐                      │
│                      │    登录            │                      │
│                      └───────────────────┘                      │
│                                                                 │
│              ┌─────────────────────────────┐                    │
│              │  使用 Google 账号登录        │                    │
│              └─────────────────────────────┘                    │
│                                                                 │
│              ┌─────────────────────────────┐                    │
│              │  使用 Authelia 登录          │                    │
│              └─────────────────────────────┘                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 6.5.2 仪表盘 (Dashboard)

```
┌─────────────────────────────────────────────────────────────────┐
│  仪表盘                              2025年1月  ┌─────────────┐  │
│                                      ┌─────┴──┴─────┐           │
│                                      │ 用户设置     │           │
│                                      └─────────────┘           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────┐  ┌─────────────────────────────┐  │
│  │  总资产                 │  │  本月收支                    │  │
│  │  $125,000.00           │  │  ┌─────────────────────┐    │  │
│  │  ↑ 5.2% vs 上月        │  │  │ 收入: $15,000      │    │  │
│  └─────────────────────────┘  │  │ 支出: $8,500        │    │  │
│                              │  │  结余: $6,500        │    │  │
│                              │  └─────────────────────┘    │  │
│                              └─────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  账户概览                                               │  │
│  │  ┌─────────┬──────────┬──────────┬──────────┐          │  │
│  │  │ 资产    │ 负债     │ 收入     │ 支出     │          │  │
│  │  ├─────────┼──────────┼──────────┼──────────┤          │  │
│  │  │ $88,500 │ -$105    │ $15,000  │ $8,500   │          │  │
│  │  └─────────┴──────────┴──────────┴──────────┘          │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  最近交易                          查看全部 →           │  │
│  │  ┌─────────────────────────────────────────────────┐    │  │
│  │  │ 01-15  便利店午餐         expense:food   -$50   │    │  │
│  │  │ 01-14  工资到账           revenue:salary +$25k  │    │  │
│  │  │ 01-13  超市购物           expense:grocer -$320  │    │  │
│  │  └─────────────────────────────────────────────────┘    │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 6.5.3 账户管理页

```
┌─────────────────────────────────────────────────────────────────┐
│  账户                              ┌─────────────────────────┐  │
│                             + 新建账户                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  搜索账户...                                   [🔍]    │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  资产                                                    │  │
│  │  ▶ 银行                                                 │  │
│  │    ├─ 💰 支票账户 (HK$ 50,000)                          │  │
│  │    ├─ 💰 储蓄账户 (HK$ 30,000)                          │  │
│  │    └─ 💰 外汇账户 (USD 5,000)                           │  │
│  │  ▶ 投资                                                 │  │
│  │    ├─ 💰 股票账户 (HK$ 100,000)                         │  │
│  │    └─ 💰 加密货币 (BTC 0.5)                             │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  负债                                                    │  │
│  │  ▶ 信用卡                                               │  │
│  │    ├─ 💳 Visa 卡 (HK$ 5,000)                            │  │
│  │    └─ 💳 Master 卡 (HK$ 2,000)                          │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  收入                                                    │  │
│  │  ▶ 薪资                                                  │  │
│  │    └─ 主工资 (HK$ 25,000/月)                            │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  支出                                                    │  │
│  │  ▶ 餐饮                                                  │  │
│  │    ├─ 🍽️ 餐厅 (HK$ 3,000/月)                            │  │
│  │    └─ 🍔 快餐 (HK$ 1,500/月)                            │  │
│  │  ▶ 交通                                                  │  │
│  │    └─ 🚇 地铁 (HK$ 500/月)                              │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 6.5.4 日记账页

```
┌─────────────────────────────────────────────────────────────────┐
│  日记账                          ┌─────────────────────────┐  │
│                            + 新建日记账                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  筛选器: [2025年1月 ▾] [全部账户 ▾] [全部标签 ▾]  [搜索...]     │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  日记账                      平衡: HK$ 0.00          [+/-]  ││
│  ├─────────────────────────────────────────────────────────────┤│
│  │  2025-01-17                                           🗑️    ││
│  │  便利店午餐                                                  ││
│  │  ┌────────────────┬──────────┬─────────────────┐            ││
│  │  │ 账户           │ 金额      │ 标签             │            ││
│  │  ├────────────────┼──────────┼─────────────────┤            ││
│  │  │ expense:food   │ -$50.00  │ [food] [lunch]  │            ││
│  │  │ assets:cash    │ +$50.00  │                 │            ││
│  │  └────────────────┴──────────┴─────────────────┘            ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  日记账                      平衡: HK$ 0.00          [+/-]  ││
│  ├─────────────────────────────────────────────────────────────┤│
│  │  2025-01-16                                           🗑️    ││
│  │  超市购物                                                  ││
│  │  ┌────────────────┬──────────┬─────────────────┐            ││
│  │  │ 账户           │ 金额      │ 标签             │            ││
│  │  ├────────────────┼──────────┼─────────────────┤            ││
│  │  │ expense:grocer │ -$320.00 │ [groceries]     │            ││
│  │  │ assets:bank    │ +$320.00 │                 │            ││
│  │  └────────────────┴──────────┴─────────────────┘            ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│                    加载更多...                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 6.5.5 报表页

```
┌─────────────────────────────────────────────────────────────────┐
│  报表                            [资产负债表] [损益表] [导出]    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  资产负债表                                 2025-01-17   │  │
│  ├─────────────────────────────────────────────────────────┤  │
│  │                                                         │  │
│  │  资产                                           $125,000│  │
│  │  ├── 流动资产                                   $80,000│  │
│  │  │   ├── 现金                                   $5,000│  │
│  │  │   ├── 银行存款                               $50,000│  │
│  │  │   └── 应收账款                               $25,000│  │
│  │  └── 非流动资产                                $45,000│  │
│  │      ├── 固定资产                               $30,000│  │
│  │      └── 投资                                   $15,000│  │
│  │                                                         │  │
│  │  负债                                            $5,000│  │
│  │  ├── 流动负债                                    $5,000│  │
│  │  │   └── 应付账款                               $5,000│  │
│  │  └── 长期负债                                       $0  │
│  │                                                         │  │
│  │  权益                                          $120,000│  │
│  │  ├── 实收资本                                  $100,000│  │
│  │  └── 留存收益                                   $20,000│  │
│  │                                                         │  │
│  │  ───────────────────────────────────────────────────   │  │
│  │  负债+权益                                     $125,000│  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 6.6 主题与样式

使用 Tailwind CSS + shadcn/ui，遵循以下设计原则：

- **配色**: 采用柔和的配色方案，适合长时间使用
- **字体**: Inter 字体，清晰的层次结构
- **间距**: 8px 基础网格
- **响应式**: 移动端优先，支持桌面端
- **暗色模式**: 支持 light/dark 模式切换

```typescript
// tailwind.config.ts
export default {
  darkMode: ['class'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
      },
    },
  },
}
```

---

## 7. 后端架构

### 7.1 模块结构

```
backend/src/
├── main.ts                      # 应用入口
├── app.module.ts                # 根模块
│
├── auth/                        # 认证模块
│   ├── auth.module.ts
│   ├── auth.service.ts
│   ├── auth.guard.ts
│   ├── jwt.strategy.ts
│   ├── authelia.middleware.ts   # Authelia Header 认证
│   └── dto/
│
├── tenants/                     # 租户模块
│   ├── tenants.module.ts
│   ├── tenants.service.ts
│   ├── tenants.guard.ts         # 租户上下文设置
│   └── dto/
│
├── accounts/                    # 账户模块
│   ├── accounts.module.ts
│   ├── accounts.service.ts
│   ├── accounts.controller.ts
│   ├── accounts.repository.ts
│   └── dto/
│
├── journal/                     # 日记账模块
│   ├── journal.module.ts
│   ├── journal.service.ts
│   ├── journal.controller.ts
│   ├── journal.repository.ts
│   ├── journal.validator.ts     # 借贷平衡验证
│   └── dto/
│
├── query/                       # 查询引擎模块
│   ├── query.module.ts
│   ├── query.service.ts         # 核心查询逻辑
│   ├── query.controller.ts
│   ├── balance-calculator.ts    # 余额计算
│   ├── merger.ts                # 账户合并逻辑
│   ├── rate-converter.ts        # 汇率转换
│   ├── cache.service.ts         # 查询缓存
│   └── dto/
│
├── rates/                       # 汇率引擎模块
│   ├── rates.module.ts
│   ├── rates.service.ts
│   ├── rates.controller.ts
│   ├── rate.engine.ts           # 核心汇率逻辑
│   ├── rate.provider.ts         # Provider 接口
│   ├── js-plugin.loader.ts      # JS 插件加载器
│   ├── rest-api.provider.ts     # REST API Provider
│   └── dto/
│
├── providers/                   # Provider 管理模块
│   ├── providers.module.ts
│   ├── providers.service.ts
│   ├── providers.controller.ts
│   ├── providers.repository.ts
│   └── dto/
│
├── scheduler/                   # 定时任务模块
│   ├── scheduler.module.ts
│   ├── scheduler.service.ts
│   ├── rate-fetch.task.ts      # 汇率获取任务
│   └── report-generate.task.ts # 报表生成任务
│
├── budgets/                     # 预算模块
│   ├── budgets.module.ts
│   ├── budgets.service.ts
│   ├── budgets.controller.ts
│   ├── budgets.repository.ts
│   ├── budget-calculator.ts    # 预算进度计算
│   └── dto/
│
├── reports/                     # 报表模块
│   ├── reports.module.ts
│   ├── reports.service.ts
│   ├── reports.controller.ts
│   ├── reports.repository.ts
│   ├── balance-sheet.generator.ts
│   ├── income-statement.generator.ts
│   └── dto/
│
├── currencies/                  # 货币模块
│   ├── currencies.module.ts
│   ├── currencies.service.ts
│   └── dto/
│
└── common/                      # 公共模块
    ├── decorators/
    │   ├── current-user.decorator.ts
    │   ├── current-tenant.decorator.ts
    │   └── public.decorator.ts
    ├── filters/
    │   └── exception.filter.ts
    ├── interceptors/
    │   ├── logging.interceptor.ts
    │   └── tenant-context.interceptor.ts
    ├── guards/
    │   └── roles.guard.ts
    └── utils/
```

### 7.2 认证模块

```typescript
// auth/auth.service.ts
@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersService.findByEmail(email);
    if (user && await bcrypt.compare(password, user.password)) {
      return user;
    }
    return null;
  }

  async login(user: User) {
    const payload = { sub: user.id, email: user.email, tenant_id: user.tenant_id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}

// auth/authelia.middleware.ts
@Injectable()
export class AutheliaMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const authUser = req.headers['x-auth-user'];
    const authEmail = req.headers['x-auth-email'];
    
    if (authUser && authEmail) {
      // 从 Authelia Header 提取用户信息
      req['user'] = {
        id: authUser,
        email: authEmail,
        provider: 'authelia',
      };
    }
    
    next();
  }
}
```

### 7.3 查询引擎核心逻辑

```typescript
// query/query.service.ts
@Injectable()
export class QueryService {
  constructor(
    private journalRepository: JournalLineRepository,
    private accountRepository: AccountRepository,
    private rateEngine: RateEngine,
    private cacheService: CacheService,
  ) {}

  async getBalances(query: BalancesQueryRequest): Promise<BalancesQueryResponse> {
    const cacheKey = this.generateCacheKey('balances', query);
    
    // 尝试从缓存获取
    const cached = await this.cacheService.get(cacheKey);
    if (cached && query.use_cache !== false) {
      return { ...cached, meta: { ...cached.meta, cache_hit: true } };
    }

    // 获取账户信息
    const accounts = await this.accountRepository.findWithFilter(query.account_filter);
    
    // 计算每个账户的余额
    const balances = await Promise.all(
      accounts.map(async (account) => {
        const currencyBalances = await this.calculateAccountBalance(
          account.id,
          query.date_range,
        );
        
        // 货币转换
        if (query.convert_to) {
          const converted = await this.convertBalances(
            currencyBalances,
            query.convert_to,
            query.exchange_rate_date,
          );
          return { account, currencies: converted };
        }
        
        return { account, currencies: currencyBalances };
      })
    );

    // 按深度合并
    const merged = this.mergeByDepth(balances, query.depth);
    
    // 分页
    const paginated = this.paginate(merged, query.pagination);
    
    // 缓存结果
    await this.cacheService.set(cacheKey, paginated, 300); // 5分钟缓存
    
    return {
      ...paginated,
      meta: {
        cache_hit: false,
        calculated_at: new Date().toISOString(),
      },
    };
  }

  private async calculateAccountBalance(
    accountId: string,
    dateRange?: DateRange,
  ): Promise<CurrencyBalance[]> {
    // 获取账户及其所有子账户
    const accountIds = await this.accountRepository.getDescendantIds(accountId);
    
    // 汇总所有日记账分录
    const lines = await this.journalRepository.sumByCurrency(accountIds, dateRange);
    
    return lines;
  }

  private mergeByDepth(
    balances: AccountBalance[],
    depth: number | 'all',
  ): AccountBalance[] {
    if (depth === 'all') return balances;
    
    // 按路径前缀分组并合并
    const grouped = new Map<string, AccountBalance[]>();
    
    for (const balance of balances) {
      const pathParts = balance.account.path.split(':');
      const groupKey = pathParts.slice(0, depth).join(':');
      
      if (!grouped.has(groupKey)) {
        grouped.set(groupKey, []);
      }
      grouped.get(groupKey)!.push(balance);
    }
    
    // 合并同组账户
    return Array.from(grouped.entries()).map(([key, group]) => {
      const mergedCurrencies = this.mergeCurrencies(
        group.flatMap((b) => b.currencies),
      );
      return {
        account: {
          id: group[0].account.id,
          path: key,
          name: key.split(':').pop() || key,
          type: group[0].account.type,
          depth,
        },
        currencies: mergedCurrencies,
      };
    });
  }

  private async convertBalances(
    balances: CurrencyBalance[],
    targetCurrency: string,
    rateDate: 'latest' | 'query_date' | 'specific_date',
  ): Promise<CurrencyBalance[]> {
    const converted: CurrencyBalance[] = [];
    
    for (const balance of balances) {
      if (balance.currency === targetCurrency) {
        converted.push(balance);
        continue;
      }
      
      const rate = await this.rateEngine.getRate(
        balance.currency,
        targetCurrency,
        rateDate,
      );
      
      converted.push({
        currency: targetCurrency,
        amount: balance.amount * rate,
      });
    }
    
    return converted;
  }
}
```

### 7.4 汇率引擎

```typescript
// rates/rate.engine.ts
@Injectable()
export class RateEngine {
  constructor(
    private providerLoader: ProviderLoader,
    private rateRepository: ExchangeRateRepository,
  ) {}

  async getRate(
    from: string,
    to: string,
    options: RateOptions = {},
  ): Promise<RateResult> {
    const { date = 'latest', providerId, recordHistory = true } = options;
    
    // 尝试从数据库获取历史汇率
    if (date !== 'latest') {
      const cached = await this.rateRepository.findAtDate(from, to, date);
      if (cached) {
        return cached;
      }
    }
    
    // 从 Provider 获取
    const provider = providerId
      ? await this.providerLoader.getProvider(providerId)
      : await this.providerLoader.getDefaultProvider();
    
    let rate: RateResult;
    if (date === 'latest') {
      rate = await provider.getLatestRate(from, to);
    } else {
      rate = await provider.getRateAtDate(from, to, new Date(date));
    }
    
    // 记录到历史
    if (recordHistory) {
      await this.rateRepository.save({
        provider_id: provider.id,
        from_currency: from,
        to_currency: to,
        rate: rate.rate,
        date: new Date(),
        fetched_at: new Date(),
      });
    }
    
    return rate;
  }

  async convert(
    amount: number,
    from: string,
    to: string,
    options: RateOptions = {},
  ): Promise<ConvertResult> {
    const rate = await this.getRate(from, to, options);
    
    return {
      amount,
      from,
      to,
      converted_amount: amount * rate.rate,
      rate: rate.rate,
      timestamp: rate.timestamp,
      source: rate.source,
    };
  }

  // 计算交叉汇率
  async getCrossRate(
    from: string,
    to: string,
    via: string[] = ['USD'],
  ): Promise<number> {
    let totalRate = 1;
    
    for (const currency of via) {
      const rate = await this.getRate(from, currency);
      totalRate *= rate.rate;
      from = currency;
    }
    
    const finalRate = await this.getRate(from, to);
    totalRate *= finalRate.rate;
    
    return totalRate;
  }
}
```

### 7.5 缓存服务

```typescript
// query/cache.service.ts
@Injectable()
export class CacheService {
  private cache: Map<string, { data: any; expiresAt: number }> = new Map();

  async get<T>(key: string): Promise<T | null> {
    const item = this.cache.get(key);
    
    if (!item) return null;
    
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data as T;
  }

  async set(key: string, data: any, ttlSeconds: number = 300): Promise<void> {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  async invalidate(pattern: string): Promise<void> {
    const regex = new RegExp(pattern.replace('*', '.*'));
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }
}
```

---

## 8. 安全设计

### 8.1 认证机制

```typescript
// 多 provider 支持
const authOptions = {
  providers: [
    // Email/Password
    CredentialsProvider({
      name: 'Email',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // 验证逻辑
      },
    }),
    // OAuth
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    // Authelia (通过自定义 provider)
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.tenant_id = user.tenant_id;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.tenant_id = token.tenant_id;
      return session;
    },
  },
};
```

### 8.2 行级安全 (RLS)

```sql
-- 账户表 RLS
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_accounts_select" ON accounts
  FOR SELECT
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY "tenant_accounts_insert" ON accounts
  FOR INSERT
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY "tenant_accounts_update" ON accounts
  FOR UPDATE
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY "tenant_accounts_delete" ON accounts
  FOR DELETE
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- 对 journal_lines, budgets, reports 同样应用 RLS
```

### 8.3 租户上下文中间件

```typescript
// common/interceptors/tenant-context.interceptor.ts
@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    if (user?.tenant_id) {
      // 设置 PostgreSQL 会话变量
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.query(
        `SELECT set_config('app.current_tenant_id', $1, false)`,
        [user.tenant_id]
      );
    }
    
    return next.handle();
  }
}

// 使用
@UseGuards(JwtAuthGuard)
@UseInterceptors(TenantContextInterceptor)
@Controller('accounts')
export class AccountsController {
  // ...
}
```

### 8.4 API 安全

- **速率限制**: 使用 `express-rate-limit`
- **输入验证**: 使用 class-validator
- **SQL 注入防护**: 使用 TypeORM 参数化查询
- **XSS 防护**: Next.js 默认启用
- **CORS 配置**: 只允许受信任的域名

```typescript
// main.ts
import rateLimit from 'express-rate-limit';

const app = await NestFactory.create(AppModule);

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 分钟
    max: 100, // 限制每个 IP 100 次请求
  }),
);

app.enableCors({
  origin: process.env.CORS_ORIGIN?.split(',') || true,
  credentials: true,
});
```

---

## 9. 部署

### 9.1 Docker Compose 配置

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: accounting-db
    environment:
      POSTGRES_USER: ${DB_USER:-accounting}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-secret}
      POSTGRES_DB: ${DB_NAME:-accounting}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER:-accounting}"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: accounting-backend
    environment:
      DATABASE_HOST: postgres
      DATABASE_PORT: 5432
      DATABASE_USER: ${DB_USER:-accounting}
      DATABASE_PASSWORD: ${DB_PASSWORD:-secret}
      DATABASE_NAME: ${DB_NAME:-accounting}
      JWT_SECRET: ${JWT_SECRET:-your-secret}
      AUTH_SECRET: ${AUTH_SECRET:-your-auth-secret}
    ports:
      - "3001:3001"
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - ./backend/plugins:/app/plugins
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: accounting-frontend
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:3001
    ports:
      - "3000:3000"
    depends_on:
      - backend
    restart: unless-stopped

  # 可选: Authelia
  authelia:
    image: authelia/authelia:latest
    container_name: accounting-authelia
    volumes:
      - ./authelia/config:/config
      - ./authelia/secrets:/secrets
    ports:
      - "9090:9090"
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  postgres_data:
```

### 9.2 后端 Dockerfile

```dockerfile
# backend/Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# 复制插件目录
COPY --from=builder /app/plugins ./plugins

EXPOSE 3001

CMD ["node", "dist/main.js"]
```

### 9.3 前端 Dockerfile

```dockerfile
# frontend/Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]
```

### 9.4 环境变量

```bash
# .env.example

# 数据库
DB_USER=accounting
DB_PASSWORD=your-secret-password
DB_NAME=accounting

# JWT
JWT_SECRET=your-jwt-secret-key-min-32-chars
AUTH_SECRET=your-auth-secret

# Auth.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret

# OAuth (可选)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Authelia (可选)
AUTHELIA_URL=http://localhost:9090
AUTHELIA_API_KEY=

# API
NEXT_PUBLIC_API_URL=http://localhost:3001

# CORS
CORS_ORIGIN=http://localhost:3000
```

### 9.5 数据库迁移

```typescript
// database/migrations/1710000000-initial-schema.ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1710000000 implements MigrationInterface {
  name = 'initial-schema-1710000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    // 创建全局表
    await queryRunner.query(`
      CREATE TABLE currencies (
        code VARCHAR(10) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        symbol VARCHAR(10),
        decimal_places INT DEFAULT 2,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE providers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        type VARCHAR(50) NOT NULL,
        config JSONB NOT NULL,
        supported_currencies TEXT[],
        supports_historical BOOLEAN DEFAULT false,
        supports_date_query BOOLEAN DEFAULT false,
        record_history BOOLEAN DEFAULT true,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 创建租户表 (带 RLS)
    await queryRunner.query(`
      CREATE TABLE accounts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        parent_id UUID REFERENCES accounts(id),
        name VARCHAR(200) NOT NULL,
        type VARCHAR(50) NOT NULL,
        currency VARCHAR(10) NOT NULL,
        path VARCHAR(500) GENERATED ALWAYS AS (
          COALESCE(
            (SELECT path FROM accounts a2 WHERE a2.id = accounts.parent_id) || ':' || name,
            name
          )
        ) STORED,
        depth INT GENERATED ALWAYS AS (
          COALESCE(
            (SELECT depth + 1 FROM accounts a2 WHERE a2.id = accounts.parent_id),
            0
          )
        ) STORED,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 启用 RLS
    await queryRunner.query(`ALTER TABLE accounts ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`
      CREATE POLICY "tenant_accounts" ON accounts
      FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
    `);

    // 其他表类似...
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS accounts CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS providers CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS currencies CASCADE`);
  }
}
```

---

## 10. 测试

### 10.1 测试策略

| 类型 | 覆盖率目标 | 工具 |
|------|-----------|------|
| 单元测试 | 80% | Jest + Vue Test Utils |
| 集成测试 | 60% | Jest + Supertest |
| E2E 测试 | 关键流程 | Playwright |

### 10.2 后端测试示例

```typescript
// accounts/accounts.service.spec.ts
describe('AccountsService', () => {
  let service: AccountsService;
  let repository: AccountRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountsService,
        {
          provide: getRepositoryToken(AccountRepository),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<AccountsService>(AccountsService);
    repository = module.get<getRepositoryToken(AccountRepository));
  });

  it('should return account tree', async () => {
    const mockAccounts: Account[] = [
      {
        id: '1',
        tenant_id: 'tenant-1',
        parent_id: null,
        name: 'Assets',
        type: 'assets',
        currency: 'USD',
        path: 'assets',
        depth: 0,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: '2',
        tenant_id: 'tenant-1',
        parent_id: '1',
        name: 'Bank',
        type: 'assets',
        currency: 'USD',
        path: 'assets:bank',
        depth: 1,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];

    mockRepository.find.mockResolvedValue(mockAccounts);

    const result = await service.getAccountTree();

    expect(result).toHaveLength(1);
    expect(result[0].children).toHaveLength(1);
    expect(result[0].children[0].name).toBe('Bank');
  });

  it('should calculate account balance', async () => {
    mockRepository.sumByAccount.mockResolvedValue([
      { currency: 'USD', total: 1000 },
      { currency: 'HKD', total: 5000 },
    ]);

    const result = await service.getAccountBalance('account-1');

    expect(result).toEqual([
      { currency: 'USD', amount: 1000 },
      { currency: 'HKD', amount: 5000 },
    ]);
  });
});
```

### 10.3 API 测试示例

```typescript
// journal/journal.controller.e2e-spec.ts
describe('JournalController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('should create journal entry', () => {
    const createDto = {
      date: '2025-01-15T12:00:00Z',
      description: 'Test transaction',
      lines: [
        { account_id: 'expense-food', amount: -50, currency: 'HKD' },
        { account_id: 'assets-cash', amount: 50, currency: 'HKD' },
      ],
    };

    return request(app.getHttpServer())
      .post('/api/v1/journal')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send(createDto)
      .expect(201)
      .expect((res) => {
        expect(res.body.success).toBe(true);
        expect(res.body.data.description).toBe('Test transaction');
      });
  });

  it('should validate balanced entries', () => {
    const unbalancedDto = {
      date: '2025-01-15T12:00:00Z',
      description: 'Unbalanced transaction',
      lines: [
        { account_id: 'expense-food', amount: -50, currency: 'HKD' },
        { account_id: 'assets-cash', amount: 30, currency: 'HKD' }, // 不平衡
      ],
    };

    return request(app.getHttpServer())
      .post('/api/v1/journal')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send(unbalancedDto)
      .expect(400);
  });

  afterAll(async () => {
    await app.close();
  });
});
```

---

## 11. MVP 里程碑

### 11.1 MVP 功能范围

| 模块 | 功能 | 状态 |
|------|------|------|
| **认证** | Auth.js 基础认证 | ✅ MVP |
| | OAuth (Google) | ✅ MVP |
| | Authelia Header SSO | ✅ MVP |
| **账户** | 无限嵌套账户 CRUD | ✅ MVP |
| | 五大账户类型 | ✅ MVP |
| | 账户层级管理 | ✅ MVP |
| **日记账** | 复式记账 (多行分录) | ✅ MVP |
| | 借贷平衡验证 | ✅ MVP |
| | 标签管理 | ✅ MVP |
| **查询引擎** | 深度合并查询 | ✅ MVP |
| | 日期范围过滤 | ✅ MVP |
| | 渐进式加载 | ✅ MVP |
| | 查询缓存 | ✅ MVP |
| **汇率** | REST API Provider | ✅ MVP |
| | 基础 Provider (USD 兑换) | ✅ MVP |
| | 汇率历史记录 | ✅ MVP |
| | 货币转换 | ✅ MVP |
| **预算** | 周期性预算 | ✅ MVP |
| | 非周期性预算 | ✅ MVP |
| | 预算进度追踪 | ✅ MVP |
| **报表** | 资产负债表 | ✅ MVP |
| | 损益表 | ✅ MVP |
| **前端** | 登录页 | ✅ MVP |
| | Dashboard | ✅ MVP |
| | 账户管理页 | ✅ MVP |
| | 日记账页 | ✅ MVP |
| | 报表页 | ✅ MVP |
| | 设置页 | ✅ MVP |
| **测试** | 单元测试 | ✅ MVP |
| | 集成测试 | ✅ MVP |

### 11.2 开发阶段

#### 阶段 1: 基础架构 (2 周)

- [ ] 项目初始化 (Next.js + NestJS + PostgreSQL)
- [ ] Docker Compose 配置
- [ ] 基础认证模块 (Auth.js)
- [ ] 数据库迁移脚本
- [ ] 基础 API 框架

#### 阶段 2: 账户与日记账 (2 周)

- [ ] 账户 CRUD + 树状结构
- [ ] 日记账 CRUD + 借贷平衡
- [ ] 标签系统
- [ ] 基础前端页面

#### 阶段 3: 查询引擎 (1 周)

- [ ] 账户余额查询
- [ ] 深度合并逻辑
- [ ] 渐进式加载
- [ ] 查询缓存

#### 阶段 4: 汇率系统 (1 周)

- [ ] Provider 插件系统
- [ ] REST API Provider 实现
- [ ] 汇率获取调度
- [ ] 货币转换 API

#### 阶段 5: 预算与报表 (1 周)

- [ ] 预算 CRUD + 进度追踪
- [ ] 资产负债表生成
- [ ] 损益表生成

#### 阶段 6: 前端完善 (1 周)

- [ ] 完善所有页面 UI
- [ ] 暗色模式
- [ ] 响应式适配

#### 阶段 7: 测试与优化 (1 周)

- [ ] 单元测试 (80% 覆盖率)
- [ ] 集成测试
- [ ] 性能优化
- [ ] Bug 修复

**总计 MVP 开发时间: 9 周**

---

## 12. 附录

### 12.1 账户路径命名规范

```
# 顶级账户 (五大类别)
assets, liabilities, equity, revenue, expense

# 二级账户 (常用)
assets:bank, assets:cash, assets:investment
liabilities:credit_card, liabilities:loan
revenue:salary, revenue:investment, revenue:other
expense:food, expense:transport, expense:shopping, expense:entertainment

# 嵌套账户
expense:food:restaurant, expense:food:groceries
expense:transport:taxi, expense:transport:public
```

### 12.2 API 错误码

| 错误码 | 说明 |
|--------|------|
| ERROR_AUTH_INVALID | 认证无效 |
| ERROR_AUTH_EXPIRED | Token 过期 |
| ERROR_TENANT_INVALID | 租户无效 |
| ERROR_VALIDATION_FAILED | 验证失败 |
| ERROR_ACCOUNT_NOT_FOUND | 账户不存在 |
| ERROR_ACCOUNT_HAS_CHILDREN | 账户有子账户 |
| ERROR_JOURNAL_NOT_BALANCED | 借贷不平衡 |
| ERROR_RATE_NOT_FOUND | 汇率不存在 |
| ERROR_PROVIDER_NOT_FOUND | Provider 不存在 |
| ERROR_BUDGET_EXCEEDED | 超出预算 |

### 12.3 参考资源

- [复式记账原理](https://en.wikipedia.org/wiki/Double-entry_bookkeeping)
- [Auth.js 文档](https://authjs.dev/)
- [NestJS 文档](https://docs.nestjs.com/)
- [TypeORM 文档](https://typeorm.io/)
- [Authelia Trusted Header SSO](https://www.authelia.com/integration/trusted-header-sso/introduction/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)
