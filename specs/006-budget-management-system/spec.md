# Feature Specification: Budget Management System

**Feature Branch**: `006-budget-management-system`  
**Created**: 2026-01-25  
**Status**: Draft  
**Input**: User description: "基于已有调查，完善并实现多币种预算管理系统，包括周期性/非周期性预算、实时支出跟踪、预算警报、多币种支持、预算审批流程、差异分析报告等核心功能。目标是为用户提供完整的预算规划、监控和预警能力。"

## User Scenarios & Testing *(mandatory)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.
  
  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - Create and Manage Budgets (Priority: P1)

作为一名用户，我希望能够创建和管理周期性或非周期性的预算，以便规划我的支出和储蓄目标。

**Why this priority**: 预算是整个系统的核心功能，用户必须能够创建预算才能使用其他功能。这是基础性的、不可或缺的功能。

**Independent Test**: 可以通过创建预算、查看预算列表、更新预算金额、删除预算等操作来独立测试。交付价值：用户可以建立自己的预算框架。

**Acceptance Scenarios**:

1. **Given** 用户已登录系统，**When** 用户创建月度预算（名称、金额、币种、开始日期、警报阈值），**Then** 系统成功创建预算并显示在预算列表中
2. **Given** 用户有一个活跃的周期性预算，**When** 用户创建相同周期的新预算，**Then** 系统允许创建（不限制数量）
3. **Given** 用户有一个预算，**When** 用户更新预算金额为更小值（大于当前已支出），**Then** 系统成功更新预算
4. **Given** 用户有一个预算且已超过可修改安全阈值，**When** 用户尝试将预算金额减少到低于已支出金额，**Then** 系统拒绝修改并显示警告
5. **Given** 用户有一个预算，**When** 用户删除该预算（软删除），**Then** 预算状态变为非活跃，从活跃列表中移除

---

### User Story 2 - Monitor Budget Progress in Real-Time (Priority: P1)

作为一名用户，我希望实时查看我的预算使用进度，包括已花费金额、剩余金额和使用百分比，以便及时调整支出行为。

**Why this priority**: 实时监控是预算管理的核心价值主张，用户需要知道自己的预算执行情况才能做出明智的财务决策。

**Independent Test**: 可以通过创建预算、执行相关交易、查看预算详情页面来测试。交付价值：用户可以实时了解自己的预算执行状态。

**Acceptance Scenarios**:

1. **Given** 用户有一个活跃的预算关联到支出账户，**When** 该账户发生交易，**Then** 预算的已花费金额应在合理时间内（<5分钟）自动更新
2. **Given** 用户查看预算详情页，**When** 页面加载完成，**Then** 系统显示：预算名称、预算金额、已花费金额、剩余金额、使用百分比、状态（正常/警告/超支）
3. **Given** 用户预算使用率达到警报阈值（如80%），**When** 用户查看预算，**Then** 系统显示视觉警告（颜色变化或提示）
4. **Given** 用户预算已超出预算金额，**Then** 系统状态清晰标记为"已超支"并显示超出金额

---

### User Story 3 - Configure and Receive Budget Alerts (Priority: P1)

作为一名用户，我希望配置预算警报（如达到80%时提醒），并通过系统通知接收警报，以便及时了解预算状态变化。

**Why this priority**: 警报是预防超支的关键机制，用户需要在预算异常时及时获得通知才能采取行动。

**Independent Test**: 可以通过配置警报阈值、触发警报条件、查看通知来测试。交付价值：用户不会因忘记监控而意外超支。

**Acceptance Scenarios**:

1. **Given** 用户创建预算时设置了警报阈值（如75%），**When** 预算使用率达到该阈值，**Then** 系统生成警报记录并显示在通知中心
2. **Given** 用户有多个预算达到警报阈值，**When** 用户查看通知，**Then** 系统按优先级排序显示所有相关警报
3. **Given** 用户收到预算警报，**When** 用户点击警报消息，**Then** 系统跳转到对应预算详情页
4. **Given** 警报已在24小时内发送过，**When** 同一预算再次触发相同类型警报，**Then** 系统不重复发送同一警报
5. **Given** 用户已处理（查看/确认）警报，**Then** 警报状态更新为已确认，不再出现在待处理列表

---

### User Story 4 - Use Budget Templates (Priority: P2)

作为一名用户，我希望使用预定义的预算模板快速创建常见类型的预算，以便节省设置时间并遵循最佳实践。

**Why this priority**: 模板提升用户体验，减少创建预算的摩擦，特别适合不熟悉预算管理的用户。

**Independent Test**: 可以通过浏览模板列表、选择模板创建预算来测试。交付价值：新用户可以快速开始预算管理。

**Acceptance Scenarios**:

1. **Given** 用户首次访问预算页面，**When** 系统展示预算模板，**Then** 显示至少5种常用模板（如月度生活支出、商业运营支出、娱乐预算、医疗支出、周度购物预算）
2. **Given** 用户选择"月度生活支出"模板，**When** 用户应用模板，**Then** 系统预填充模板中定义的默认金额、币种、账户类型和警报阈值
3. **Given** 用户创建了自定义预算，**When** 用户保存该预算为模板，**Then** 系统创建自定义模板供后续使用
4. **Given** 用户有多个自定义模板，**When** 用户管理模板，**Then** 用户可以编辑或删除自己创建的模板

---

### User Story 5 - Multi-Currency Budget Management (Priority: P2)

作为一名有多币种收入和支出的用户，我希望能够以不同币种管理预算，并查看换算为统一基准币种的预算汇总，以便准确了解整体财务状况。

**Why this priority**: 多币种支持是系统的差异化功能，用户（特别是国际用户）需要统一视角的预算管理。

**Independent Test**: 可以通过创建多币种预算、查看汇总报告来测试。交付价值：多币种用户可以准确掌握整体预算状况。

**Acceptance Scenarios**:

1. **Given** 用户有美元预算和港币预算，**When** 用户查看预算汇总，**Then** 系统显示各币种预算明细以及换算为基准币种（如USD）的总预算、总花费、总剩余
2. **Given** 用户创建预算时选择非基准币种，**When** 系统显示预算金额，**Then** 同时显示换算后的基准币种金额
3. **Given** 用户设置预算警报阈值，**When** 系统计算使用百分比，**Then** 使用交易原始币种金额换算后计算

---

### User Story 6 - View Budget Variance Reports (Priority: P2)

作为一名用户，我希望查看预算与实际支出的差异分析报告，以便评估预算执行效果并优化未来的预算规划。

**Why this priority**: 差异分析是预算管理的进阶功能，帮助用户从历史数据中学习并改进预算质量。

**Independent Test**: 可以通过生成报告、查看图表来测试。交付价值：用户可以量化评估预算准确性并持续改进。

**Acceptance Scenarios**:

1. **Given** 用户有至少1个月的预算历史数据，**When** 用户生成差异分析报告，**Then** 系统显示：预算金额、实际花费、差异额、差异百分比
2. **Given** 用户查看差异报告，**Then** 系统同时显示趋势图（预算vs实际的周/月度对比）
3. **Given** 预算显示超支，**When** 用户查看详细分析，**Then** 系统显示导致超支的主要支出类别和金额
4. **Given** 用户选择时间范围，**When** 生成报告，**Then** 报告只包含选定范围内的数据

---

### User Story 7 - Apply Budget Templates (Priority: P3)

作为一名用户，我希望能够将预算模板应用到特定的账户或支出类别，以便快速创建针对性的预算。

**Why this priority**: 模板应用是将通用模板个性化的关键步骤，提升模板的实用性。

**Independent Test**: 可以通过选择模板、关联账户来测试。交付价值：用户可以快速创建与实际账户匹配的预算。

**Acceptance Scenarios**:

1. **Given** 用户选择预算模板，**When** 用户选择要关联的账户，**Then** 系统将预算与选定账户的交易关联
2. **Given** 用户选择支出类别模板（如"餐饮"），**When** 用户应用模板，**Then** 系统自动匹配对应类别下的所有子账户进行汇总
3. **Given** 模板要求的账户类型不存在，**When** 用户应用模板，**Then** 系统提示用户先创建所需类型的账户

---

### Edge Cases

- **当预算周期结束但有进行中的交易未结算时**：系统应将待处理交易计入预计花费，并在报告中标记
- **当用户删除已关联交易记录的预算时**：系统软删除预算，保留历史数据用于报告
- **当汇率剧烈波动导致多币种预算数据异常时**：系统使用最近有效汇率并标记数据可能不准确
- **当多个用户同时修改同一预算时**：系统使用乐观锁机制，后提交的用户需刷新后重新提交
- **当系统检测到预算数据异常（如负数金额）时**：系统拒绝保存并提示用户检查输入

## Requirements *(mandatory)*

### Functional Requirements

#### Budget Core Management (P1)

- **FR-B001**: 系统 MUST 支持创建周期性预算（月度/周度/年度），包含名称、金额、币种、开始日期、结束日期（可选）、警报阈值、关联账户路径
- **FR-B002**: 系统 MUST 支持创建非周期性预算（一次性/目标型），包含名称、金额、币种、开始日期、结束日期（可选）、警报阈值
- **FR-B003**: 系统 MUST 支持预算软删除（设置 is_active = false），保留历史数据用于审计和报告
- **FR-B004**: 系统 MUST 验证预算金额为正数
- **FR-B005**: 系统 MUST 验证结束日期晚于开始日期
- **FR-B006**: 系统 MUST 禁止将预算金额减少到低于当前已花费金额（除非管理员强制操作）
- **FR-B007**: 系统 MUST 支持按状态（全部/活跃/非活跃）筛选预算列表
- **FR-B008**: 系统 MUST 支持按名称、账户、日期范围搜索预算

#### Real-Time Progress Tracking (P1)

- **FR-B009**: 系统 MUST 在 journal_lines 表变更时自动更新关联预算的 spent_amount（延迟不超过5分钟）
- **FR-B010**: 系统 MUST 提供预算进度计算接口，返回：budget_id、spent_amount、remaining_amount、percentage_used、status（normal/warning/exceeded）
- **FR-B011**: 系统 MUST 计算状态阈值：percentage < alert_threshold 时为 normal，alert_threshold <= percentage < 100% 时为 warning，percentage >= 100% 时为 exceeded
- **FR-B012**: 系统 MUST 支持按预算周期（周/月/年）自动计算当前周期的起止日期

#### Budget Alerts (P1)

- **FR-B013**: 系统 MUST 支持三种警报类型：Threshold（达到阈值）、Exceeded（超出预算）、Period End（周期即将结束）
- **FR-B014**: 系统 MUST 实现警报去重机制：同一预算的同一类型警报在24小时内不重复发送
- **FR-B015**: 系统 MUST 记录警报详情：budget_id、alert_type、threshold_percent、spent_amount、budget_amount、currency、message
- **FR-B016**: 系统 MUST 支持用户确认（acknowledge）或 dismissal 警报
- **FR-B017**: 系统 MUST 提供待处理警报列表，按时间和优先级排序

#### Budget Templates (P2)

- **FR-B018**: 系统 MUST 预置至少8种系统模板：月度生活支出、商业运营支出、娱乐预算、医疗支出、周度购物预算、年度订阅管理、季度税务储备、储蓄目标
- **FR-B019**: 系统 MUST 支持用户创建自定义模板，包含模板名称、描述、类别、默认周期类型、默认金额、默认币种、默认警报阈值
- **FR-B020**: 系统 MUST 允许用户编辑或删除自己创建的自定义模板
- **FR-B021**: 系统 MUST 禁止修改或删除系统预置模板
- **FR-B022**: 系统 MUST 支持通过模板快速创建预算，预填充模板中的默认值

#### Multi-Currency Support (P2)

- **FR-B023**: 系统 MUST 支持为预算指定币种，预算金额和已花费金额使用该币种存储
- **FR-B024**: 系统 MUST 提供多币种预算汇总接口，返回按基准币种换算的总预算、总花费、总剩余、使用百分比
- **FR-B025**: 系统 MUST 在计算使用百分比时，将所有交易金额换算到预算币种
- **FR-B026**: 系统 MUST 评估多币种暴露风险（低/中/高），基于币种数量判断

#### Variance Analysis (P2)

- **FR-B027**: 系统 MUST 提供差异分析接口，计算：budget_id、budget_name、period、original_budget、revised_budget、actual_spending、budget_variance、budget_variance_percentage
- **FR-B028**: 系统 MUST 识别有利差异（实际花费 < 预算）和不利差异（实际花费 > 预算）
- **FR-B029**: 系统 MUST 支持按日/周/月粒度生成差异趋势数据
- **FR-B030**: 系统 MUST 计算支出速度（日均花费），用于预测期末余额

#### API Requirements

- **FR-B031**: 系统 MUST 提供 REST API 端点：GET /budgets（列表）、POST /budgets（创建）、GET /budgets/:id（详情）、PUT /budgets/:id（更新）、DELETE /budgets/:id（删除）
- **FR-B032**: 系统 MUST 提供进度查询端点：GET /budgets/:id/progress
- **FR-B033**: 系统 MUST 提供警报列表端点：GET /budgets/:id/alerts
- **FR-B034**: 系统 MUST 提供模板列表端点：GET /budget-templates
- **FR-B035**: 系统 MUST 提供差异报告端点：GET /budgets/:id/variance
- **FR-B036**: 所有 API 端点 MUST 验证租户 ID，确保数据隔离
- **FR-B037**: 所有 API 端点 MUST 验证用户认证

#### Frontend Requirements

- **FR-B038**: 系统 MUST 提供预算列表页面，显示所有预算卡片
- **FR-B039**: 系统 MUST 提供预算详情页面，显示进度条、使用百分比、警报状态
- **FR-B040**: 系统 MUST 提供预算创建/编辑表单，包含所有必要字段和验证
- **FR-B041**: 系统 MUST 提供模板浏览和快速创建页面
- **FR-B042**: 系统 MUST 提供警报通知中心，显示待处理警报
- **FR-B043**: 系统 MUST 提供差异分析报告页面，包含图表和数据表格
- **FR-B044**: 预算进度数据 MUST 每60秒自动刷新

### Key Entities

- **Budget**: 预算实体，代表用户的预算计划
  - id（UUID）、tenant_id、account_id（可选，关联账户）、name、type（periodic/non_periodic）、amount（预算金额）、currency、start_date、end_date（可选）、period_type（monthly/weekly/yearly/null）、spent_amount、spent_currency、alert_threshold、is_active、created_at、updated_at、deleted_at
  - 关联：Account（可选）、BudgetAlert（多个）、BudgetTemplate（通过名称关联）

- **BudgetAlert**: 预算警报实体，记录预算状态变化
  - id（UUID）、tenant_id、budget_id、alert_type（budget_warning/budget_exceeded/budget_depleted/budget_period_end）、status（pending/sent/acknowledged/dismissed）、threshold_percent、spent_amount、budget_amount、currency、message、user_id、sent_at、acknowledged_at、created_at
  - 关联：Budget

- **BudgetTemplate**: 预算模板实体，预定义或用户创建
  - id（UUID）、tenant_id、name、description、category（personal/business/savings/expense/custom）、is_system_template、account_pattern、account_type、default_period_type、default_amount、default_currency、default_alert_threshold、suggested_categories、metadata、is_active、created_at、updated_at
  - 关联：Tenant

- **BudgetProgress**: 预算进度值对象（接口，非实体）
  - budget_id、spent_amount、remaining_amount、percentage_used、days_remaining、projected_spend、status（normal/warning/exceeded）

- **VarianceReport**: 差异报告值对象
  - budget_id、budget_name、period、original_budget、revised_budget、total_commitments、actual_spending、budget_variance、budget_variance_percentage、favorable_variance、unfavorable_variance、spending_velocity、projected_end_balance

### Assumptions

1. 汇率服务已存在并可正常获取实时汇率
2. 账户系统已实现，支持层级账户路径查询
3. 日记账系统已实现，支持按账户路径和时间范围查询交易
4. 用户认证和租户隔离机制已存在
5. 通知系统已有基础架构（可复用现有系统）
6. 系统默认基准币种为USD，但用户可配置
7. 预算使用Decimal类型存储金额，避免浮点精度问题
8. 警报通知优先使用站内通知，邮件为可选渠道

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-B001**: 用户可在3分钟内完成创建第一个预算（从空白状态到预算显示在列表中）
- **SC-B002**: 预算进度更新延迟不超过5分钟（从交易确认到预算进度变化）
- **SC-B003**: 95%的预算进度查询响应时间小于500毫秒
- **SC-B004**: 90%的警报在触发后30秒内出现在通知中心
- **SC-B005**: 85%的用户能够成功使用模板创建预算（无错误）
- **SC-B006**: 多币种预算汇总计算准确率100%（与手动计算结果一致）
- **SC-B007**: 差异报告数据与实际交易数据100%一致
- **SC-B008**: 用户满意度评分（使用后调查）达到4.0/5.0以上
- **SC-B009**: 预算超支率降低20%（通过警报机制）
- **SC-B010**: 系统支持单租户1000个活跃预算、10000条历史警报记录

### Technology-Agnostic Constraints

- 所有用户数据 MUST 支持租户级别的逻辑隔离
- 预算数据 MUST 支持审计追溯（创建人、创建时间、修改历史）
- 系统 MUST 在预算创建/更新时进行输入验证
- 预算金额 MUST 使用高精度Decimal类型存储
- 警报 MUST 不会因系统负载而丢失
- 用户 MUST 能够导出自己的预算数据

---

*Specification generated based on codebase analysis and requirements research completed on 2026-01-25*
