import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsUUID,
  IsDateString,
  IsEnum,
} from 'class-validator';
import type { DemoStatus, DemoEquipmentAvailability } from '@arihant/shared';

export class CreateDemoDto {
  @IsUUID('all')
  @IsNotEmpty({ message: 'Organisation is required' })
  organisation_id!: string;

  @IsUUID('all')
  @IsOptional()
  lead_id?: string;

  @IsUUID('all')
  @IsOptional()
  product_id?: string;

  @IsUUID('all')
  @IsOptional()
  assigned_to?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsDateString()
  @IsOptional()
  requested_date?: string;

  @IsDateString()
  @IsOptional()
  confirmed_date?: string;

  @IsString()
  @IsOptional()
  expected_audience?: string;

  @IsString()
  @IsOptional()
  equipment_required?: string;

  @IsString()
  @IsOptional()
  special_requirements?: string;
}

export class ReserveEquipmentDto {
  @IsUUID('all')
  @IsNotEmpty()
  equipment_id!: string;

  @IsDateString()
  @IsNotEmpty()
  reserved_from!: string;

  @IsDateString()
  @IsNotEmpty()
  reserved_to!: string;
}

export class SubmitDemoOutcomeDto {
  @IsBoolean()
  @IsOptional()
  completed?: boolean;

  @IsString()
  @IsOptional()
  customer_response?: string;

  @IsString()
  @IsOptional()
  technical_performance?: string;

  @IsString()
  @IsOptional()
  product_suitability?: string;

  @IsBoolean()
  @IsOptional()
  decision_maker_present?: boolean;

  @IsString()
  @IsOptional()
  competitor_involved?: string;

  @IsString()
  @IsOptional()
  next_step?: string;

  @IsString()
  @IsNotEmpty({ message: 'Result (success or fail) is required' })
  result!: 'success' | 'fail';

  @IsString()
  @IsOptional()
  failure_reason?: string;

  @IsString()
  @IsOptional()
  remarks?: string;
}

export class CreateEquipmentDto {
  @IsUUID('all')
  @IsNotEmpty()
  product_id!: string;

  @IsString()
  @IsNotEmpty()
  model!: string;

  @IsString()
  @IsNotEmpty()
  serial_no!: string;

  @IsString()
  @IsNotEmpty({ message: 'Location (Patna/Delhi/Kolkata) is required' })
  current_location!: string;

  @IsUUID('all')
  @IsOptional()
  responsible_person?: string;

  @IsString()
  @IsOptional()
  condition?: string;
}
