import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsUUID,
  IsDateString,
  IsEnum,
  ValidateIf,
  Matches,
} from 'class-validator';
import type { TenderCategory, TenderStatus } from '@arihant/shared';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class CreateTenderDto {
  @IsString()
  @IsNotEmpty({ message: 'Tender number is required' })
  tender_no!: string;

  @IsOptional()
  @ValidateIf((o, v) => Boolean(v))
  @Matches(UUID_PATTERN)
  organisation_id?: string;

  @IsString()
  @IsOptional()
  department?: string;

  @IsOptional()
  @ValidateIf((o, v) => Boolean(v))
  @Matches(UUID_PATTERN)
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

  @IsOptional()
  @ValidateIf((o, v) => Boolean(v))
  @Matches(UUID_PATTERN)
  zone_id?: string;

  @IsOptional()
  @ValidateIf((o, v) => Boolean(v))
  @Matches(UUID_PATTERN)
  region_id?: string;

  @IsString()
  @IsOptional()
  category?: string;

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

  @IsString()
  @IsOptional()
  portal?: string;

  @IsString()
  @IsOptional()
  reference_number?: string;

  @IsNumber()
  @IsOptional()
  estimated_value?: number;

  @IsNumber()
  @IsOptional()
  tender_value?: number;

  @IsDateString()
  @IsOptional()
  publish_date?: string;

  @IsDateString()
  @IsOptional()
  publication_date?: string; // alias

  @IsDateString()
  @IsOptional()
  bid_start_date?: string;

  @IsDateString()
  @IsOptional()
  bid_closing_date?: string;

  @IsDateString()
  @IsOptional()
  submission_deadline?: string; // alias

  @IsDateString()
  @IsOptional()
  prebid_date?: string;

  @IsString()
  @IsOptional()
  corrigendum_date?: string;

  @IsOptional()
  @ValidateIf((o, v) => Boolean(v))
  @Matches(UUID_PATTERN)
  assigned_to?: string;

  @IsOptional()
  @ValidateIf((o, v) => Boolean(v))
  @Matches(UUID_PATTERN)
  assigned_person_id?: string; // alias

  @IsOptional()
  @ValidateIf((o, v) => Boolean(v))
  @Matches(UUID_PATTERN)
  tender_owner_id?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  remarks?: string;
}

export class UpdateTenderDto {
  @IsString()
  @IsOptional()
  tender_no?: string;

  @Matches(UUID_PATTERN)
  @IsOptional()
  organisation_id?: string;

  @IsString()
  @IsOptional()
  department?: string;

  @Matches(UUID_PATTERN)
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

  @Matches(UUID_PATTERN)
  @IsOptional()
  zone_id?: string;

  @Matches(UUID_PATTERN)
  @IsOptional()
  region_id?: string;

  @IsString()
  @IsOptional()
  category?: string;

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

  @IsString()
  @IsOptional()
  portal?: string;

  @IsString()
  @IsOptional()
  reference_number?: string;

  @IsNumber()
  @IsOptional()
  estimated_value?: number;

  @IsNumber()
  @IsOptional()
  tender_value?: number;

  @IsDateString()
  @IsOptional()
  publish_date?: string;

  @IsDateString()
  @IsOptional()
  publication_date?: string;

  @IsDateString()
  @IsOptional()
  bid_start_date?: string;

  @IsDateString()
  @IsOptional()
  bid_closing_date?: string;

  @IsDateString()
  @IsOptional()
  submission_deadline?: string;

  @IsDateString()
  @IsOptional()
  submission_date?: string;

  @IsDateString()
  @IsOptional()
  result_date?: string;

  @IsDateString()
  @IsOptional()
  prebid_date?: string;

  @IsString()
  @IsOptional()
  corrigendum_date?: string;

  @Matches(UUID_PATTERN)
  @IsOptional()
  assigned_to?: string;

  @Matches(UUID_PATTERN)
  @IsOptional()
  assigned_person_id?: string;

  @Matches(UUID_PATTERN)
  @IsOptional()
  tender_owner_id?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  remarks?: string;

  @IsString()
  @IsOptional()
  rejection_reason?: string;
}

export class ChangeTenderStatusDto {
  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  target_status?: string; // alias

  @IsString()
  @IsOptional()
  remarks?: string;

  @IsString()
  @IsOptional()
  rejection_reason?: string;

  @IsString()
  @IsOptional()
  loss_reason?: string;

  @IsString()
  @IsOptional()
  competitor?: string;

  @IsNumber()
  @IsOptional()
  value_lakh?: number;

  @IsDateString()
  @IsOptional()
  result_date?: string;

  @IsDateString()
  @IsOptional()
  submission_date?: string;
}

export class ApproveTenderDto {
  @IsString()
  @IsNotEmpty({ message: 'Decision is required (approved / rejected)' })
  decision!: string;

  @IsString()
  @IsOptional()
  remarks?: string;

  @IsString()
  @IsOptional()
  rejection_reason?: string;
}

export class RecordTenderOutcomeDto {
  @IsString()
  @IsNotEmpty({ message: 'Outcome result is required (won / lost)' })
  result!: string;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsString()
  @IsOptional()
  loss_reason?: string;

  @IsString()
  @IsOptional()
  competitor?: string;

  @IsNumber()
  @IsOptional()
  value_lakh?: number;

  @IsDateString()
  @IsOptional()
  result_date?: string;

  @IsString()
  @IsOptional()
  remarks?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class CreateTenderPortalIssueDto {
  @IsString()
  @IsNotEmpty({ message: 'Issue description is required' })
  issue!: string;

  @IsDateString()
  @IsOptional()
  reported_date?: string;

  @IsOptional()
  @ValidateIf((o, v) => Boolean(v))
  @Matches(UUID_PATTERN)
  responsible_person_id?: string;

  @IsString()
  @IsOptional()
  escalated_to?: string;

  @IsString()
  @IsOptional()
  resolution_status?: string;

  @IsString()
  @IsOptional()
  resolution?: string;

  @IsString()
  @IsOptional()
  remarks?: string;
}

export class UpdateTenderPortalIssueDto {
  @IsString()
  @IsOptional()
  issue?: string;

  @IsOptional()
  @ValidateIf((o, v) => Boolean(v))
  @Matches(UUID_PATTERN)
  responsible_person_id?: string;

  @IsString()
  @IsOptional()
  escalated_to?: string;

  @IsString()
  @IsOptional()
  resolution_status?: string;

  @IsString()
  @IsOptional()
  resolution?: string;

  @IsString()
  @IsOptional()
  remarks?: string;
}

export class TenderQueryDto {
  @IsOptional()
  page?: number | string;

  @IsOptional()
  limit?: number | string;

  @IsOptional()
  search?: string;

  @IsOptional()
  status?: string;

  @IsOptional()
  category?: string;

  @IsOptional()
  organisation_id?: string;

  @IsOptional()
  organisation?: string;

  @IsOptional()
  department?: string;

  @IsOptional()
  product_id?: string;

  @IsOptional()
  city?: string;

  @IsOptional()
  state?: string;

  @IsOptional()
  zone_id?: string;

  @IsOptional()
  zone?: string;

  @IsOptional()
  region_id?: string;

  @IsOptional()
  region?: string;

  @IsOptional()
  assigned_to?: string;

  @IsOptional()
  assignedPerson?: string;

  @IsOptional()
  tender_owner_id?: string;

  @IsOptional()
  tenderOwner?: string;

  @IsOptional()
  deadline?: string; // due_today, urgent_48h, upcoming_7d, overdue

  @IsOptional()
  closingSoonOnly?: string | boolean;

  @IsOptional()
  sortBy?: string;

  @IsOptional()
  sortOrder?: 'asc' | 'desc';

  @IsOptional()
  from_date?: string;

  @IsOptional()
  to_date?: string;

  @IsOptional()
  date_field?: string;
}
