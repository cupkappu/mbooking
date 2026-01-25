/**
 * BudgetAmountValidator Tests
 * 
 * Tests for FR-C001: Users cannot reduce budget amount below spent amount
 * Tests for FR-C002: Validation error message in Chinese with spent amount
 */

import { ValidationArguments } from 'class-validator';
import { BudgetAmountValidator } from './budget-amount.validator';

describe('BudgetAmountValidator', () => {
  let validator: BudgetAmountValidator;

  beforeEach(() => {
    validator = new BudgetAmountValidator();
  });

  describe('validate', () => {
    it('should allow update when new amount equals spent amount', () => {
      const mockBudget = { spent_amount: 500 };
      const args: ValidationArguments = {
        object: mockBudget,
        property: 'amount',
        value: 500,
        constraints: [],
        targetName: 'UpdateBudgetDto',
      };

      const result = validator.validate(500, args);
      expect(result).toBe(true);
    });

    it('should allow update when new amount is greater than spent amount', () => {
      const mockBudget = { spent_amount: 500 };
      const args: ValidationArguments = {
        object: mockBudget,
        property: 'amount',
        value: 1000,
        constraints: [],
        targetName: 'UpdateBudgetDto',
      };

      const result = validator.validate(1000, args);
      expect(result).toBe(true);
    });

    it('should reject update when new amount is less than spent amount', () => {
      const mockBudget = { spent_amount: 500 };
      const args: ValidationArguments = {
        object: mockBudget,
        property: 'amount',
        value: 400,
        constraints: [],
        targetName: 'UpdateBudgetDto',
      };

      const result = validator.validate(400, args);
      expect(result).toBe(false);
    });

    it('should allow update when spent_amount is undefined', () => {
      const mockBudget = { spent_amount: undefined };
      const args: ValidationArguments = {
        object: mockBudget,
        property: 'amount',
        value: 100,
        constraints: [],
        targetName: 'UpdateBudgetDto',
      };

      const result = validator.validate(100, args);
      expect(result).toBe(true);
    });

    it('should allow update when spent_amount is null', () => {
      const mockBudget = { spent_amount: null as unknown as undefined };
      const args: ValidationArguments = {
        object: mockBudget,
        property: 'amount',
        value: 100,
        constraints: [],
        targetName: 'UpdateBudgetDto',
      };

      const result = validator.validate(100, args);
      expect(result).toBe(true);
    });

    it('should handle spent_amount as string number', () => {
      const mockBudget = { spent_amount: '500' as unknown as number };
      const args: ValidationArguments = {
        object: mockBudget,
        property: 'amount',
        value: 400,
        constraints: [],
        targetName: 'UpdateBudgetDto',
      };

      const result = validator.validate(400, args);
      expect(result).toBe(false);
    });

    it('should handle zero spent amount', () => {
      const mockBudget = { spent_amount: 0 };
      const args: ValidationArguments = {
        object: mockBudget,
        property: 'amount',
        value: 0,
        constraints: [],
        targetName: 'UpdateBudgetDto',
      };

      const result = validator.validate(0, args);
      expect(result).toBe(true);
    });
  });

  describe('defaultMessage', () => {
    it('should return Chinese error message with spent amount', () => {
      const mockBudget = { spent_amount: 500 };
      const args: ValidationArguments = {
        object: mockBudget,
        property: 'amount',
        value: 400,
        constraints: [],
        targetName: 'UpdateBudgetDto',
      };

      const message = validator.defaultMessage(args);
      expect(message).toContain('预算金额不能低于已花费金额');
      expect(message).toContain('500');
    });

    it('should handle undefined spent amount in error message', () => {
      const mockBudget = { spent_amount: undefined };
      const args: ValidationArguments = {
        object: mockBudget,
        property: 'amount',
        value: 100,
        constraints: [],
        targetName: 'UpdateBudgetDto',
      };

      const message = validator.defaultMessage(args);
      expect(message).toContain('预算金额不能低于已花费金额');
      expect(message).toContain('0');
    });
  });
});
