import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsUUID,
  IsDateString,
  IsEnum,
} from 'class-validator';
import type { ServicePriority, WarrantyStatus, ServiceTicketStatus } from '@arihant/shared';

export class CreateTicketDto {
  @IsUUID('all')
  @IsNotEmpty({ message: 'Organisation is required' })
  organisation_id!: string;

  @IsUUID('all')
  @IsOptional()
  contact_id?: string;

  @IsUUID('all')
  @IsOptional()
  product_id?: string;

  @IsString()
  @IsOptional()
  equipment_serial?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsNotEmpty({ message: 'Complaint details are required' })
  complaint!: string;

  @IsEnum(['low', 'medium', 'high', 'critical'] as const)
  @IsOptional()
  priority?: ServicePriority;

  @IsEnum(['in_warranty', 'out_of_warranty', 'amc'] as const)
  @IsOptional()
  warranty_status?: WarrantyStatus;

  @IsUUID('all')
  @IsOptional()
  assigned_to?: string;

  @IsDateString()
  @IsOptional()
  planned_visit_date?: string;
}

export class UpdateTicketStatusDto {
  @IsString()
  @IsNotEmpty()
  status!: ServiceTicketStatus;

  @IsUUID('all')
  @IsOptional()
  assigned_to?: string;

  @IsDateString()
  @IsOptional()
  planned_visit_date?: string;
}

export class SubmitServiceReportDto {
  @IsString()
  @IsNotEmpty({ message: 'Problem identified is required' })
  problem_identified!: string;

  @IsString()
  @IsNotEmpty({ message: 'Action taken is required' })
  action_taken!: string;

  @IsString()
  @IsOptional()
  parts_replaced?: string;

  @IsString()
  @IsOptional()
  warranty_status?: string;

  @IsBoolean()
  @IsOptional()
  customer_confirmation?: boolean;

  @IsBoolean()
  @IsOptional()
  further_work_required?: boolean;

  @IsDateString()
  @IsOptional()
  next_visit_date?: string;

  @IsString()
  @IsOptional()
  report_url?: string;
}
