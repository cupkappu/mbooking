# Feature Specification: Budget Management System Completion

**Feature Branch**: `007-budget-completion`
**Created**: 2026-01-25
**Status**: Draft
**Input**: User description: "完善Budget Management System的功能缺失，包括：1)添加E2E测试验证完整用户流程；2)实现预算减少验证(FR-B006)；3)实现journal变更触发的预算自动更新；4)验证24小时警报去重；5)添加系统模板seeding数据；6)完成多币种汇总端点；7)实现模板保护逻辑"

**Context**: This feature addresses gaps identified in the verification of the Budget Management System (006-budget-management-system). The core functionality is implemented, but several critical requirements need completion and validation.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Budget Update Validation (Priority: P1)

作为一名用户，我希望在修改预算时系统能够保护我免于错误地将预算金额减少到低于已花费金额，以便维护预算的财务完整性。

**Why this priority**: 这是保护用户免于意外错误的关键安全机制，防止预算数据不一致。

**Independent Test**: 可以通过尝试减少预算金额到低于已花费值来测试，系统应拒绝该操作并显示警告。

**Acceptance Scenarios**:

1. **Given** 用户有一个预算金额为$1000、已花费$600的预算，**When** 用户尝试将预算减少到$500，**Then** 系统拒绝修改并显示警告信息"预算金额不能低于已花费金额 $600"
2. **Given** 用户有一个预算金额为$1000、已花费$600的预算，**When** 用户成功将预算减少到$700，**Then** 系统接受修改并更新预算
3. **Given** 管理员账户，**When** 管理员尝试将预算减少到低于已花费金额，**Then** 系统允许操作并记录管理员操作日志

---

### User Story 2 - Real-Time Budget Auto-Update (Priority: P1)

作为一名用户，我希望当我进行交易时预算进度能够自动更新，以便实时了解我的预算执行情况而无需手动刷新。

**Why this priority**: 实时更新是预算监控的核心价值，用户需要即时反馈来做出明智的财务决策。

**Independent Test**: 可以通过创建预算、执行交易、检查预算进度是否自动更新来测试。

**Acceptance Scenarios**:

1. **Given** 用户有一个关联到支出账户的活跃预算，**When** 该账户发生新交易（$50支出），**Then** 预算的已花费金额应在交易确认后30秒内自动更新
2. **Given** 用户查看预算详情页（未手动刷新），**When** 页面停留60秒，**Then** 进度数据应自动更新至少一次
3. **Given** 系统检测到journal_lines表有新记录，**When** 记录关联到有预算的账户，**Then** 系统应触发预算spent_amount重新计算

---

### User Story 3 - Alert Deduplication Validation (Priority: P1)

作为一名用户，我希望系统不会在短时间内重复发送相同的预算警报，以便避免警报疲劳并保持警报的有效性。

**Why this priority**: 重复警报会导致用户忽略重要通知，降低系统的可用性和用户信任。

**Independent Test**: 可以通过触发警报、等待24小时内再次触发相同条件、检查是否收到重复警报来测试。

**Acceptance Scenarios**:

1. **Given** 用户预算达到80%阈值并触发警报，**When** 同一预算在24小时内再次达到80%阈值，**Then** 系统不发送重复警报
2. **Given** 用户预算达到80%阈值并触发警报，**When** 24小时后预算再次达到80%阈值，**Then** 系统发送新的警报记录
3. **Given** 用户有多个预算达到相同阈值，**When** 系统处理警报，**Then** 每个预算独立计算去重窗口

---

### User Story 4 - System Template Seeding (Priority: P1)

作为一名新用户，我希望系统预置常用预算模板以便快速开始预算管理，而无需从零开始创建预算。

**Why this priority**: 预置模板降低新用户的入门门槛，提供最佳实践参考，提升首次使用体验。

**Independent Test**: 可以通过首次访问预算页面、查看模板列表来验证系统模板是否存在。

**Acceptance Scenarios**:

1. **Given** 系统首次部署或新租户创建，**When** 系统初始化运行，**Then** 应自动创建8种系统预算模板
2. **Given** 用户浏览模板列表，**When** 用户查看系统模板，**Then** 显示至少8种预置模板（生活支出、商业运营、娱乐、医疗、周度购物、年度订阅、税务储备、储蓄目标）
3. **Given** 用户尝试编辑系统模板，**When** 用户提交修改，**Then** 系统拒绝并提示"系统预置模板无法修改"
4. **Given** 用户尝试删除系统模板，**When** 用户提交删除，**Then** 系统拒绝并提示"系统预置模板无法删除"

---

### User Story 5 - Multi-Currency Summary Endpoint (Priority: P1)

作为一名有多币种收入和支出的用户，我希望能够查看所有预算以基准币种汇总的视图，以便准确了解整体财务状况。

**Why this priority**: 多币种用户需要统一视角来管理整体预算，这是系统的差异化功能。

**Independent Test**: 可以通过创建多币种预算、调用汇总API、验证返回数据来测试。

**Acceptance Scenarios**:

1. **Given** 用户有USD $1000和HKD $7800（假设汇率1:7.8）的预算，**When** 用户调用多币种汇总API，**Then** 系统返回总预算$2000（USD基准）
2. **Given** 用户设置基准币种为EUR，**When** 系统计算汇总，**Then** 所有金额应换算为EUR显示
3. **Given** 用户有3种以上不同币种的预算，**When** 系统评估暴露风险，**Then** 应返回风险等级（低/中/高）

---

### User Story 6 - Template Protection (Priority: P1)

作为一名系统管理员，我希望系统模板不能被普通用户修改或删除，以确保系统预置模板的完整性和一致性。

**Why this priority**: 系统模板代表最佳实践，意外修改可能导致所有用户受影响。

**Independent Test**: 可以尝试通过API和UI修改/删除系统模板来验证保护机制。

**Acceptance Scenarios**:

1. **Given** 用户尝试通过API更新系统模板（is_system_template=true），**When** 系统处理请求，**Then** 返回错误"无法修改系统预置模板"
2. **Given** 用户尝试通过UI编辑系统模板，**When** 用户点击编辑按钮，**Then** 编辑表单应禁用或显示提示
3. **Given** 用户尝试通过API删除系统模板，**When** 系统处理请求，**Then** 返回错误"无法删除系统预置模板"
4. **Given** 管理员账户，**When** 管理员尝试修改系统模板，**Then** 系统同样拒绝（保护适用于所有用户）

---

### User Story 7 - E2E Test Coverage (Priority: P1)

作为一名开发人员，我希望有完整的端到端测试覆盖预算管理系统的所有核心功能，以便在代码变更时能够快速发现回归问题。

**Why this priority**: E2E测试是确保系统完整性和用户流程正确性的最后防线。

**Independent Test**: 可以通过运行E2E测试套件并验证所有budget相关测试通过来验证。

**Acceptance Scenarios**:

1. **Given** 测试环境已配置，**When** 运行budget相关E2E测试套件，**Then** 所有测试应通过
2. **Given** 用户登录到系统，**When** 执行完整的预算创建-查看-编辑-删除流程，**Then** 测试能够成功完成整个流程
3. **Given** 预算达到阈值触发警报，**When** 用户确认警报，**Then** E2E测试能够验证警报状态变更

---

### Edge Cases

- **当汇率在短时间内剧烈波动时**：多币种汇总应使用最近有效汇率，并在UI上标记数据可能不准确
- **当多个用户同时修改同一预算时**：使用乐观锁机制，后提交的用户需刷新后重新提交
- **当系统检测到预算数据异常（如负数金额）时**：系统拒绝保存并提示用户检查输入
- **当用户删除已触发过警报的预算时**：警报记录应保留用于审计
- **当系统模板初始化时数据库已存在同名模板**：跳过创建并记录警告日志

## Requirements *(mandatory)*

### Functional Requirements

#### Budget Update Safety (P1)

- **FR-C001**: 系统 MUST 在更新预算金额时验证新金额 >= 当前已花费金额
- **FR-C002**: 当验证失败时，系统 MUST 返回明确的错误消息"预算金额不能低于已花费金额"
- **FR-C003**: 系统 SHOULD 提供管理员强制操作选项（需要额外权限验证）

#### Real-Time Progress Tracking (P1)

- **FR-C004**: 系统 MUST 在 journal_lines 表插入新记录时自动触发关联预算的 spent_amount 更新
- **FR-C004b**: 缓存更新采用乐观更新机制 - 新journal产生时立即更新预算缓存以提供即时用户反馈
- **FR-C004c**: 系统 MUST 异步验证缓存数据与实时计算数据的一致性
- **FR-C004d**: 系统 MUST 在验证发现不一致时自动修正缓存值
- **FR-C005**: 自动更新延迟 MUST NOT 超过30秒（从journal确认到缓存更新）
- **FR-C006**: 系统 MUST 支持通过事件驱动架构实现预算进度自动更新
- **FR-C007**: 前端 MUST 实现60秒自动刷新机制确保进度数据最新

#### Alert Deduplication (P1)

- **FR-C008**: 系统 MUST 在创建新警报前检查同一预算、同一类型在24小时内是否存在已发送警报
- **FR-C009**: 警报去重 MUST 基于 budget_id + alert_type + 24小时时间窗口
- **FR-C010**: 系统 MUST 记录警报发送时间用于去重计算
- **FR-C010b**: 警报去重时间窗口从警报创建时间开始计算，同一预算+同一警报类型在24小时内不重复发送

#### System Templates (P1)

- **FR-C011**: 系统 MUST 在新租户创建时为该租户初始化8种系统预算模板
- **FR-C011b**: 系统模板与租户关联，存储在 budget_templates 表中（tenant_id 关联）
- **FR-C012**: 系统模板 MUST 标记 is_system_template = true
- **FR-C013**: 系统 MUST 禁止更新 is_system_template = true 的模板
- **FR-C014**: 系统 MUST 禁止删除 is_system_template = true 的模板
- **FR-C015**: 系统预置模板 MUST 包含：月度生活支出、商业运营支出、娱乐预算、医疗支出、周度购物预算、年度订阅管理、季度税务储备、储蓄目标

#### Multi-Currency Summary (P1)

- **FR-C016**: 系统 MUST 提供多币种预算汇总API端点 GET /budgets/summary/multicurrency
- **FR-C017**: 汇总 MUST 支持指定基准币种参数
- **FR-C018**: 系统 MUST 将所有预算金额换算为基准币种进行汇总
- **FR-C019**: 系统 MUST 返回暴露风险评估（基于币种数量）
- **FR-C020**: 汇总 MUST 包含：总预算、总花费、总剩余、使用百分比

#### Template Protection (P1)

- **FR-C021**: API端点 MUST 在更新模板前检查 is_system_template 标志
- **FR-C022**: API端点 MUST 在删除模板前检查 is_system_template 标志
- **FR-C023**: 前端 MUST 禁用系统模板的编辑/删除按钮或显示明确提示
- **FR-C024**: 错误响应 MUST 包含用户友好的提示信息

#### Testing (P1)

- **FR-C025**: 系统 MUST 包含budget完整工作流的E2E测试
- **FR-C026**: E2E测试 MUST 覆盖：创建预算、查看进度、编辑预算、删除预算、确认警报
- **FR-C027**: 测试环境 MUST 能够独立运行所有budget相关测试
- **FR-C028**: 测试 MUST 验证用户流程的正确性而非实现细节

## Clarifications

### Session 2026-01-25

- Q: 用户角色与权限 - 管理员账户的权限范围 → A: 管理员可强制操作但需记录审计日志 (FR-C003实现)
- Q: 警报去重时间窗口 - 从何时开始计算？ → A: 24小时窗口从警报创建时间开始，同一预算+同一警报类型不重复发送
- Q: 预算自动更新机制 - 采用何种技术实现？ → A: 缓存模式 + 异步验证机制。新journal产生时立即乐观更新缓存，同时异步验证数据一致性，验证失败时自动修正缓存
- Q: 系统模板存储模式 - 共享全局还是租户私有？ → A: 租户私有模式。每个租户拥有自己的模板副本（包括系统模板），符合现有实体设计

### Technology-Agnostic Constraints

- 预算更新验证 MUST 在服务端执行，不能仅依赖客户端验证
- 自动更新机制 MUST 与现有journal系统集成，不引入紧耦合
- 系统模板初始化 MUST 是幂等操作，可安全重复执行
- 多币种换算 MUST 使用与系统其他部分相同的汇率服务
- 所有测试 MUST 可在隔离环境中运行，不依赖外部服务

---

*Specification generated to complete Budget Management System implementation gaps identified on 2026-01-25*
