import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsUUID,
  IsDateString,
} from 'class-validator';
import type { LeadCategory, LeadProbability, ChannelType } from '@arihant/shared';

export class CreateLeadDto {
  @IsUUID('all')
  @IsNotEmpty({ message: 'Organisation is required' })
  organisation_id!: string;

  @IsUUID('all')
  @IsOptional()
  primary_contact_id?: string;

  @IsUUID('all')
  @IsNotEmpty({ message: 'Product is required' })
  product_id!: string;

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

  @IsUUID('all')
  @IsOptional()
  assigned_to?: string;

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

export class UpdateLeadDto {
  @IsUUID('all')
  @IsOptional()
  primary_contact_id?: string;

  @IsUUID('all')
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

  @IsUUID('all')
  @IsOptional()
  assigned_to?: string;

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
