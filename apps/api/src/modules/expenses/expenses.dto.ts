import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsUUID,
  IsDateString,
  IsEnum,
  Min,
} from 'class-validator';
import type { ExpenseCategory } from '@arihant/shared';

export class CreateExpenseDto {
  @IsUUID('all')
  @IsOptional()
  visit_id?: string;

  @IsUUID('all')
  @IsOptional()
  organisation_id?: string;

  @IsDateString()
  @IsNotEmpty({ message: 'Expense date is required' })
  expense_date!: string;

  @IsEnum(
    ['travel', 'hotel', 'local_conveyance', 'food', 'demo', 'service', 'other'] as const,
    { message: 'Invalid expense category' },
  )
  category!: ExpenseCategory;

  @IsNumber({}, { message: 'Amount must be a number' })
  @Min(1, { message: 'Amount must be greater than zero' })
  amount!: number;

  @IsString()
  @IsNotEmpty({ message: 'Purpose is required' })
  purpose!: string;

  @IsString()
  @IsOptional()
  receipt_url?: string;

  @IsString()
  @IsOptional()
  remarks?: string;
}

export class ManagerApproveExpenseDto {
  @IsEnum(['manager_approved', 'rejected', 'clarification_required'] as const)
  @IsNotEmpty()
  decision!: 'manager_approved' | 'rejected' | 'clarification_required';

  @IsString()
  @IsOptional()
  manager_remarks?: string;
}

export class AccountsProcessExpenseDto {
  @IsEnum(['accounts_processed', 'rejected'] as const)
  @IsNotEmpty()
  decision!: 'accounts_processed' | 'rejected';

  @IsString()
  @IsOptional()
  remarks?: string;
}
