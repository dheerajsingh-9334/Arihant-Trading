import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsUUID,
  IsDateString,
  IsEnum,
} from 'class-validator';
import type { VisitStatus } from '@arihant/shared';

export class CreateVisitDto {
  @IsUUID('all')
  @IsNotEmpty({ message: 'Organisation is required' })
  organisation_id!: string;

  @IsUUID('all')
  @IsOptional()
  contact_id?: string;

  @IsUUID('all')
  @IsOptional()
  product_id?: string;

  @IsUUID('all')
  @IsOptional()
  assigned_to?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsDateString({}, { message: 'Planned date must be a valid date' })
  @IsNotEmpty()
  planned_date!: string;

  @IsString()
  @IsOptional()
  purpose?: string;

  @IsBoolean()
  @IsOptional()
  demo_required?: boolean;

  @IsBoolean()
  @IsOptional()
  travel_required?: boolean;

  @IsString()
  @IsOptional()
  expected_outcome?: string;

  @IsString()
  @IsOptional()
  remarks?: string;
}

export class ChangeVisitStatusDto {
  @IsEnum(['planned', 'completed', 'cancelled', 'rescheduled'] as const)
  @IsNotEmpty()
  status!: VisitStatus;

  @IsString()
  @IsOptional()
  change_reason?: string;

  @IsDateString()
  @IsOptional()
  rescheduled_to?: string;
}

export class SubmitVisitUpdateDto {
  @IsBoolean()
  @IsOptional()
  met_completed?: boolean;

  @IsString()
  @IsOptional()
  person_met?: string;

  @IsString()
  @IsOptional()
  discussion?: string;

  @IsString()
  @IsOptional()
  product_discussed?: string;

  @IsString()
  @IsOptional()
  outcome?: string;

  @IsString()
  @IsOptional()
  opportunity?: string;

  @IsString()
  @IsOptional()
  tender_opportunity?: string;

  @IsBoolean()
  @IsOptional()
  demo_required?: boolean;

  @IsString()
  @IsOptional()
  next_action?: string;

  @IsDateString()
  @IsOptional()
  followup_date?: string;

  @IsString()
  @IsOptional()
  remarks?: string;
}

export class ManagerInterventionDto {
  @IsString()
  @IsNotEmpty({ message: 'Instructions for the employee are required' })
  instructions!: string;
}
