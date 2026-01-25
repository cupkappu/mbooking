# Tasks: Budget Management System Completion

**Input**: Design documents from `/specs/007-budget-completion/`
**Feature Branch**: `007-budget-completion`
**Date**: 2026-01-25
**Spec**: [spec.md](./spec.md)
**Plan**: [plan.md](./plan.md)
**Data Model**: [plan.md#data-model](./plan.md#data-model)
**Contracts**: [contracts/openapi.yaml](./contracts/openapi.yaml)
**Quickstart**: [quickstart.md](./quickstart.md)

**Tests**: E2E tests are required per specification (FR-C025-C028)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, etc.)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Backend DTOs update and frontend structure initialization

- [ ] T001 Create backend validators directory at `backend/src/budgets/validators/`
- [ ] T002 [P] Create E2E tests directory structure at `e2e/` (verify exists)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Backend validation, services, and entities that ALL user stories depend on

**CRITICAL**: No user story work can begin until this phase is complete

### Validation Infrastructure

- [ ] T003 [P] Create BudgetAmountValidator at `backend/src/budgets/validators/budget-amount.validator.ts`
- [ ] T004 [P] Register BudgetAmountValidator in `backend/src/budgets/budgets.module.ts`

### UpdateBudgetDto Enhancement

- [ ] T005 [P] Update UpdateBudgetDto to add BudgetAmountValidator at `backend/src/budgets/dto/update-budget.dto.ts`
- [ ] T006 [P] Add import statement for BudgetAmountValidator in UpdateBudgetDto

### BudgetsService Enhancement

- [ ] T007 [P] Add update validation logic in BudgetsService at `backend/src/budgets/budgets.service.ts`
- [ ] T008 [P] Add administrator override method (FR-C003) in BudgetsService

### Backend Unit Tests

- [ ] T009 [P] Add unit test for BudgetAmountValidator at `backend/src/budgets/validators/budget-amount.validator.spec.ts`
- [ ] T010 [P] Add update validation test in `backend/src/budgets/budgets.service.spec.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Budget Update Validation (Priority: P1)

**Goal**: Users cannot reduce budget amount below spent amount

**Independent Test**: User attempts to reduce budget below spent amount and receives error message. Valid reductions succeed. Admin override is logged.

### Backend Implementation

- [ ] T011 [US1] Verify UpdateBudgetDto validation at `backend/src/budgets/dto/update-budget.dto.ts`
- [ ] T012 [US1] Implement update endpoint validation in BudgetsController at `backend/src/budgets/budgets.controller.ts`

### Frontend Implementation

- [ ] T013 [US1] Add validation error display in BudgetForm at `frontend/components/budgets/budget-form/budget-form.tsx`
- [ ] T014 [US1] Add toast notification for validation errors in BudgetForm

**Checkpoint**: User Story 1 complete - budget update validation functional

---

## Phase 4: User Story 2 - Real-Time Budget Auto-Update (Priority: P1)

**Goal**: Budget progress updates automatically when journal entries are created

**Independent Test**: User creates a transaction and budget progress updates within 30 seconds without manual refresh.

### Backend Implementation

- [ ] T015 [US2] Create BudgetProgressService at `backend/src/budgets/services/budget-progress.service.ts`
- [ ] T016 [US2] Implement optimistic cache update in BudgetProgressService
- [ ] T017 [US2] Implement async validation of cache vs real calculation in BudgetProgressService
- [ ] T018 [US2] Add cache correction logic when validation fails in BudgetProgressService
- [ ] T019 [US2] Integrate BudgetProgressService with journal entry creation event

### Frontend Implementation

- [ ] T020 [US2] Verify 60-second auto-refresh in useBudgetProgress hook at `frontend/hooks/use-budget-progress.ts`

### Backend Unit Tests

- [ ] T021 [US2] Add unit tests for BudgetProgressService at `backend/src/budgets/services/budget-progress.service.spec.ts`
- [ ] T022 [US2] Add cache update validation test in budgets.service.spec.ts

**Checkpoint**: User Story 2 complete - real-time progress tracking functional

---

## Phase 5: User Story 3 - Alert Deduplication Validation (Priority: P1)

**Goal**: Same alert type for same budget is not sent more than once in 24 hours

**Independent Test**: User triggers alert, same condition triggered again within 24 hours, no duplicate alert. After 24 hours, new alert is created.

### Backend Implementation

- [ ] T023 [US3] Add findExistingAlert method in BudgetAlertService at `backend/src/budgets/budget-alert.service.ts`
- [ ] T024 [US3] Implement 24-hour deduplication check in BudgetAlertService
- [ ] T025 [US3] Add sent_at timestamp validation for deduplication in BudgetAlertService

### Backend Unit Tests

- [ ] T026 [US3] Add alert deduplication tests in `backend/src/budgets/budget-alert.service.spec.ts`

**Checkpoint**: User Story 3 complete - alert deduplication functional

---

## Phase 6: User Story 4 - System Template Seeding (Priority: P1)

**Goal**: New tenants get 8 system templates automatically

**Independent Test**: New tenant accesses system and sees 8 pre-defined templates. Templates cannot be edited or deleted.

### Backend Implementation

- [ ] T027 [US4] Create template seeding service at `backend/src/budgets/services/template-seeding.service.ts`
- [ ] T028 [US4] Implement check-and-create logic for system templates
- [ ] T029 [US4] Integrate template seeding with tenant creation flow
- [ ] T030 [US4] Add idempotency check to prevent duplicate templates

### Backend Unit Tests

- [ ] T031 [US4] Add template seeding tests at `backend/src/budgets/services/template-seeding.service.spec.ts`

**Checkpoint**: User Story 4 complete - system template seeding functional

---

## Phase 7: User Story 5 - Multi-Currency Summary Endpoint (Priority: P1)

**Goal**: Users can view all budgets converted to a base currency

**Independent Test**: User creates budgets in USD and HKD, calls summary API, receives correct total in base currency with risk assessment.

### Backend Implementation

- [ ] T032 [US5] Implement getMultiCurrencySummary method in BudgetsService at `backend/src/budgets/budgets.service.ts`
- [ ] T033 [US5] Add base currency conversion using RateGraphEngine in BudgetsService
- [ ] T034 [US5] Implement exposure risk assessment (low/medium/high) in getMultiCurrencySummary
- [ ] T035 [US5] Add multicurrency summary endpoint GET /budgets/summary/multicurrency in BudgetsController

### Backend Unit Tests

- [ ] T036 [US5] Add multi-currency summary tests in `backend/src/budgets/budgets.service.spec.ts`

**Checkpoint**: User Story 5 complete - multi-currency summary functional

---

## Phase 8: User Story 6 - Template Protection (Priority: P1)

**Goal**: System templates cannot be modified or deleted by any user

**Independent Test**: User attempts to update/delete system template via API or UI, receives error message. Both API and UI are protected.

### Backend Implementation

- [ ] T037 [US6] Add is_system_template check in template update endpoint at `backend/src/budgets/budgets.controller.ts`
- [ ] T038 [US6] Add is_system_template check in template delete endpoint at `backend/src/budgets/budgets.controller.ts`
- [ ] T039 [US6] Add is_system_template check in BudgetTemplateService at `backend/src/budgets/budget-template.service.ts`

### Frontend Implementation

- [ ] T040 [US6] Disable edit/delete buttons for system templates in TemplateBrowser at `frontend/components/budgets/template-browser/template-browser.tsx`
- [ ] T041 [US6] Add visual indicator for system templates in TemplateBrowser

### Backend Unit Tests

- [ ] T042 [US6] Add template protection tests in `backend/src/budgets/budget-template.service.spec.ts`

**Checkpoint**: User Story 6 complete - template protection functional

---

## Phase 9: User Story 7 - E2E Test Coverage (Priority: P1)

**Goal**: Complete E2E test suite for budget workflows

**Independent Test**: All E2E tests pass. Budget workflow tests verify complete user journey.

### E2E Tests

- [ ] T043 [US7] Create budget workflow E2E test at `e2e/budget-workflow.spec.ts`
- [ ] T044 [US7] Add test for budget creation and validation
- [ ] T045 [US7] Add test for budget update with validation (FR-C001/FR-C002)
- [ ] T046 [US7] Add test for budget deletion
- [ ] T047 [US7] Create alert workflow E2E test at `e2e/budget-alerts.spec.ts`
- [ ] T048 [US7] Add test for alert triggering and deduplication
- [ ] T049 [US7] Add test for alert acknowledgment
- [ ] T050 [US7] Add test for multi-currency summary API

**Checkpoint**: User Story 7 complete - E2E test coverage complete

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T051 [P] Update frontend API client at `frontend/lib/api.ts` with multi-currency endpoint
- [ ] T052 [P] Update frontend types at `frontend/types/index.ts` with new interfaces
- [ ] T053 [P] Run full backend unit test suite and verify all pass
- [ ] T054 [P] Run full E2E test suite and verify all pass
- [ ] T055 [P] Verify Docker build succeeds
- [ ] T056 [P] Verify all TypeScript compilation passes

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-8)**: All depend on Foundational phase completion
  - User stories can proceed in parallel (if staffed)
  - Or sequentially in priority order
- **E2E Tests (Phase 9)**: Depends on all user stories being complete
- **Polish (Phase 10)**: Depends on all user stories being complete

### User Story Dependencies

| Story | Priority | Depends On | Can Start After |
|-------|----------|------------|-----------------|
| US1 | P1 | Phase 2 | After T010 complete |
| US2 | P1 | Phase 2 | After T010 complete |
| US3 | P1 | Phase 2 | After T010 complete |
| US4 | P1 | Phase 2 | After T010 complete |
| US5 | P1 | Phase 2 | After T010 complete |
| US6 | P1 | Phase 2 | After T010 complete |
| US7 | P1 | Phase 3-8 | After US1-US6 complete |

### Within Each User Story

- Core implementation before integration
- Story complete before moving to polish phase

### Parallel Opportunities

- All Setup tasks (T001-T002) can run in parallel
- All Foundational tasks (T003-T010) marked [P] can run in parallel
- Once Foundational phase completes, all user stories (US1-US6) can start in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch all validation-related tasks together:
Task T003: "Create BudgetAmountValidator at backend/src/budgets/validators/budget-amount.validator.ts"
Task T004: "Register BudgetAmountValidator in budgets.module.ts"
Task T005: "Update UpdateBudgetDto to add BudgetAmountValidator"

# Launch frontend validation feedback:
Task T013: "Add validation error display in BudgetForm"
```

---

## Summary

| Metric | Value |
|--------|-------|
| **Total Tasks** | 56 |
| Setup Tasks | 2 |
| Foundational Tasks | 10 |
| User Story 1 Tasks | 4 |
| User Story 2 Tasks | 8 |
| User Story 3 Tasks | 4 |
| User Story 4 Tasks | 5 |
| User Story 5 Tasks | 5 |
| User Story 6 Tasks | 6 |
| User Story 7 Tasks | 8 |
| Polish Tasks | 6 |
| Parallelizable Tasks | ~50% marked with [P] |

**IMPLEMENTATION STATUS**: Ready for execution

**MVP Scope**: Phases 1-2 (Setup + Foundational) + User Story 1 (Budget Update Validation)

**Next Steps**:
1. Execute Phase 1: Setup
2. Execute Phase 2: Foundational (CRITICAL - blocks all stories)
3. Execute Phase 3: User Story 1 (P1 - Core validation)
4. Continue with remaining user stories in parallel
5. Execute Phase 9: E2E Tests
6. Execute Phase 10: Polish
