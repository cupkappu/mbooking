import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from 'class-validator';

/**
 * BudgetAmountValidator
 * 
 * Validates that budget amount cannot be reduced below spent amount.
 * FR-C001: Users cannot reduce budget amount below spent amount
 * FR-C002: Validation error message in Chinese with spent amount
 */
@ValidatorConstraint({ name: 'BudgetAmountValidator', async: false })
export class BudgetAmountValidator implements ValidatorConstraintInterface {
  validate(amount: number, args: ValidationArguments): boolean {
    // Get the budget object from the validation context
    // For class-validator, the object should contain the spent_amount
    const budget = args.object as { spent_amount?: number };
    
    // If no spent_amount is available, allow the update
    if (budget.spent_amount === undefined || budget.spent_amount === null) {
      return true;
    }
    
    // New amount must be greater than or equal to spent amount
    return amount >= Number(budget.spent_amount);
  }

  defaultMessage(args: ValidationArguments): string {
    const budget = args.object as { spent_amount?: number };
    const spentAmount = budget.spent_amount ?? 0;
    return `预算金额不能低于已花费金额 ${spentAmount}`;
  }
}
