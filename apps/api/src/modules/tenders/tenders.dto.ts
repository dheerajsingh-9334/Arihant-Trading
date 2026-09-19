import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsUUID,
  IsDateString,
  IsEnum,
} from 'class-validator';
import type { TenderCategory, TenderStatus } from '@arihant/shared';
import { TENDER_STATUSES } from '@arihant/shared';

export class CreateTenderDto {
  @IsString()
  @IsNotEmpty({ message: 'Tender number is required' })
  tender_no!: string;

  @IsUUID('all')
  @IsOptional()
  organisation_id?: string;

  @IsString()
  @IsOptional()
  department?: string;

  @IsUUID('all')
  @IsOptional()
  product_id?: string;

  @IsString()
  @IsOptional()
  requirement_text?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  state?: string;

  @IsUUID('all')
  @IsOptional()
  zone_id?: string;

  @IsUUID('all')
  @IsOptional()
  region_id?: string;

  @IsEnum(['pq', 'general_mha', 'other'] as const)
  @IsOptional()
  category?: TenderCategory;

  @IsNumber()
  @IsOptional()
  quantity?: number;

  @IsString()
  @IsOptional()
  bidder_turnover?: string;

  @IsString()
  @IsOptional()
  oem_turnover?: string;

  @IsNumber()
  @IsOptional()
  emd_fee?: number;

  @IsDateString()
  @IsOptional()
  publish_date?: string;

  @IsDateString()
  @IsOptional()
  bid_start_date?: string;

  @IsDateString()
  @IsOptional()
  bid_closing_date?: string;

  @IsDateString()
  @IsOptional()
  prebid_date?: string;

  @IsString()
  @IsOptional()
  corrigendum_date?: string;

  @IsUUID('all')
  @IsOptional()
  assigned_to?: string;

  @IsEnum(TENDER_STATUSES)
  @IsOptional()
  status?: TenderStatus;

  @IsString()
  @IsOptional()
  remarks?: string;
}

export class UpdateTenderDto {
  @IsString()
  @IsOptional()
  tender_no?: string;

  @IsUUID('all')
  @IsOptional()
  organisation_id?: string;

  @IsString()
  @IsOptional()
  department?: string;

  @IsUUID('all')
  @IsOptional()
  product_id?: string;

  @IsString()
  @IsOptional()
  requirement_text?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  state?: string;

  @IsUUID('all')
  @IsOptional()
  zone_id?: string;

  @IsUUID('all')
  @IsOptional()
  region_id?: string;

  @IsEnum(['pq', 'general_mha', 'other'] as const)
  @IsOptional()
  category?: TenderCategory;

  @IsNumber()
  @IsOptional()
  quantity?: number;

  @IsString()
  @IsOptional()
  bidder_turnover?: string;

  @IsString()
  @IsOptional()
  oem_turnover?: string;

  @IsNumber()
  @IsOptional()
  emd_fee?: number;

  @IsDateString()
  @IsOptional()
  bid_start_date?: string;

  @IsDateString()
  @IsOptional()
  bid_closing_date?: string;

  @IsDateString()
  @IsOptional()
  prebid_date?: string;

  @IsString()
  @IsOptional()
  corrigendum_date?: string;

  @IsUUID('all')
  @IsOptional()
  assigned_to?: string;

  @IsString()
  @IsOptional()
  remarks?: string;
}

export class ChangeTenderStatusDto {
  @IsEnum(TENDER_STATUSES, { message: 'Invalid tender status' })
  @IsNotEmpty()
  status!: TenderStatus;

  @IsString()
  @IsOptional()
  remarks?: string;
}

export class ApproveTenderDto {
  @IsEnum(['approved', 'rejected'] as const)
  @IsNotEmpty()
  decision!: 'approved' | 'rejected';

  @IsString()
  @IsOptional()
  remarks?: string;
}

export class RecordTenderOutcomeDto {
  @IsEnum(['won', 'lost'] as const)
  @IsNotEmpty()
  result!: 'won' | 'lost';

  @IsString()
  @IsOptional()
  reason?: string;

  @IsString()
  @IsOptional()
  competitor?: string;

  @IsNumber()
  @IsOptional()
  value_lakh?: number;

  @IsDateString()
  @IsOptional()
  result_date?: string;
}
