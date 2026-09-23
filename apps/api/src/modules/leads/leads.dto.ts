import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsDateString,
  IsArray,
  Matches,
} from 'class-validator';
import type {
  LeadCategory,
  LeadProbability,
  ChannelType,
  LeadStatus,
  LeadType,
  LeadLossReason,
} from '@arihant/shared';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class CreateLeadDto {
  @Matches(UUID_PATTERN, { message: 'Organisation ID must be a valid UUID' })
  @IsOptional()
  organisation_id?: string;

  @IsString()
  @IsOptional()
  organisation_name?: string;

  @Matches(UUID_PATTERN, { message: 'Contact ID must be a valid UUID' })
  @IsOptional()
  primary_contact_id?: string;

  @IsString()
  @IsOptional()
  contact_name?: string;

  @IsString()
  @IsOptional()
  contact_designation?: string;

  @IsString()
  @IsOptional()
  contact_mobile?: string;

  @IsString()
  @IsOptional()
  contact_email?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  state?: string;

  @Matches(UUID_PATTERN, { message: 'Zone ID must be a valid UUID' })
  @IsOptional()
  zone_id?: string;

  @Matches(UUID_PATTERN, { message: 'Region ID must be a valid UUID' })
  @IsOptional()
  region_id?: string;

  @IsString()
  @IsOptional()
  sector?: string;

  @IsString()
  @IsOptional()
  department?: string;

  @Matches(UUID_PATTERN, { message: 'Product ID must be a valid UUID' })
  @IsOptional()
  product_id?: string;

  @IsArray()
  @IsOptional()
  product_ids?: string[];

  @IsString()
  @IsOptional()
  source?: string;

  @IsEnum(['active', 'expected', 'follow_up'] as const)
  @IsOptional()
  category?: LeadCategory;

  @IsEnum(['high', 'medium', 'low'] as const)
  @IsOptional()
  probability?: LeadProbability;

  @IsEnum(['direct', 'partner'] as const)
  @IsOptional()
  channel?: ChannelType;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  lead_status?: LeadStatus;

  @IsString()
  @IsOptional()
  lead_type?: LeadType;

  @IsString()
  @IsOptional()
  loss_reason?: LeadLossReason;

  @Matches(UUID_PATTERN, { message: 'Assigned salesperson must be a valid UUID' })
  @IsOptional()
  assigned_to?: string;

  @Matches(UUID_PATTERN, { message: 'Regional manager must be a valid UUID' })
  @IsOptional()
  regional_manager_id?: string;

  @IsString()
  @IsOptional()
  bill_qtr?: string;

  @IsDateString()
  @IsOptional()
  last_interaction_date?: string;

  @IsString()
  @IsOptional()
  last_interaction_type?: string;

  @IsString()
  @IsOptional()
  last_interaction_notes?: string;

  @IsDateString()
  @IsOptional()
  next_followup_date?: string;

  @IsNumber()
  @IsOptional()
  qty?: number;

  @IsNumber()
  @IsOptional()
  quot_price?: number;

  @IsNumber()
  @IsOptional()
  order_price?: number;

  @IsNumber()
  @IsOptional()
  value_lakh?: number;

  @IsString()
  @IsOptional()
  booking_month?: string;

  @IsString()
  @IsOptional()
  billing_month?: string;

  @IsString()
  @IsOptional()
  order_status?: string;

  @IsString()
  @IsOptional()
  remarks?: string;
}

export class UpdateLeadDto {
  @Matches(UUID_PATTERN, { message: 'Contact ID must be a valid UUID' })
  @IsOptional()
  primary_contact_id?: string;

  @Matches(UUID_PATTERN, { message: 'Product ID must be a valid UUID' })
  @IsOptional()
  product_id?: string;

  @IsString()
  @IsOptional()
  source?: string;

  @IsEnum(['active', 'expected', 'follow_up'] as const)
  @IsOptional()
  category?: LeadCategory;

  @IsEnum(['high', 'medium', 'low'] as const)
  @IsOptional()
  probability?: LeadProbability;

  @IsEnum(['direct', 'partner'] as const)
  @IsOptional()
  channel?: ChannelType;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  lead_status?: LeadStatus;

  @IsString()
  @IsOptional()
  lead_type?: LeadType;

  @IsString()
  @IsOptional()
  loss_reason?: LeadLossReason;

  @Matches(UUID_PATTERN, { message: 'Assigned salesperson must be a valid UUID' })
  @IsOptional()
  assigned_to?: string;

  @Matches(UUID_PATTERN, { message: 'Regional manager must be a valid UUID' })
  @IsOptional()
  regional_manager_id?: string;

  @IsString()
  @IsOptional()
  bill_qtr?: string;

  @IsDateString()
  @IsOptional()
  next_followup_date?: string;

  @IsNumber()
  @IsOptional()
  qty?: number;

  @IsNumber()
  @IsOptional()
  quot_price?: number;

  @IsNumber()
  @IsOptional()
  order_price?: number;

  @IsNumber()
  @IsOptional()
  value_lakh?: number;

  @IsString()
  @IsOptional()
  booking_month?: string;

  @IsString()
  @IsOptional()
  billing_month?: string;

  @IsString()
  @IsOptional()
  order_status?: string;

  @IsString()
  @IsOptional()
  remarks?: string;
}

export class ChangeLeadStatusDto {
  @IsString()
  @IsNotEmpty({ message: 'Status is required' })
  status!: string;

  @IsString()
  @IsOptional()
  loss_reason?: string;

  @IsString()
  @IsOptional()
  remarks?: string;
}

export class AssignLeadDto {
  @Matches(UUID_PATTERN, { message: 'Assigned salesperson must be a valid UUID' })
  @IsNotEmpty({ message: 'Assigned salesperson is required' })
  assigned_to!: string;

  @Matches(UUID_PATTERN, { message: 'Regional manager must be a valid UUID' })
  @IsOptional()
  regional_manager_id?: string;

  @IsString()
  @IsOptional()
  reason?: string;
}

export class AddProductInterestDto {
  @Matches(UUID_PATTERN, { message: 'Product ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Product ID is required' })
  product_id!: string;
}
