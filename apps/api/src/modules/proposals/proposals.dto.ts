import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsInt,
  Min,
  IsIn,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';

const UUID_PATTERN = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export class CreateProposalDto {
  @Matches(UUID_PATTERN, { message: 'Customer/Organisation ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Customer (Organisation) is required' })
  organisation_id!: string;

  @Matches(UUID_PATTERN, { message: 'Product ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Product is required' })
  product_id!: string;

  @IsString()
  @IsNotEmpty({ message: 'Sector/Department is required' })
  sector!: string;

  @Matches(UUID_PATTERN, { message: 'Requested by ID must be a valid UUID' })
  @IsOptional()
  requested_by?: string;

  @Matches(UUID_PATTERN, { message: 'Responsible person ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Responsible proposal person is required' })
  responsible_id!: string;

  @Matches(UUID_PATTERN, { message: 'Follow-up owner ID must be a valid UUID' })
  @IsOptional()
  followup_owner_id?: string;

  @Matches(UUID_PATTERN, { message: 'Lead ID must be a valid UUID' })
  @IsOptional()
  lead_id?: string;

  @IsDateString({}, { message: 'Request date must be a valid YYYY-MM-DD string' })
  @IsOptional()
  request_date?: string;

  @IsDateString({}, { message: 'Required date must be a valid YYYY-MM-DD string' })
  @IsNotEmpty({ message: 'Required completion date is required' })
  required_date!: string;

  @IsDateString({}, { message: 'Sent date must be a valid YYYY-MM-DD string' })
  @IsOptional()
  sent_date?: string;

  @IsString()
  @IsOptional()
  version?: string;

  @IsString()
  @IsOptional()
  reference?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsDateString({}, { message: 'Next follow-up date must be a valid YYYY-MM-DD string' })
  @IsOptional()
  next_followup?: string;

  @IsString()
  @IsOptional()
  remarks?: string;
}

export class UpdateProposalDto {
  @Matches(UUID_PATTERN, { message: 'Customer/Organisation ID must be a valid UUID' })
  @IsOptional()
  organisation_id?: string;

  @Matches(UUID_PATTERN, { message: 'Customer/Organisation ID must be a valid UUID' })
  @IsOptional()
  customer_id?: string;

  @Matches(UUID_PATTERN, { message: 'Product ID must be a valid UUID' })
  @IsOptional()
  product_id?: string;

  @IsString()
  @IsOptional()
  sector?: string;

  @Matches(UUID_PATTERN, { message: 'Responsible person ID must be a valid UUID' })
  @IsOptional()
  responsible_id?: string;

  @Matches(UUID_PATTERN, { message: 'Follow-up owner ID must be a valid UUID' })
  @IsOptional()
  followup_owner_id?: string;

  @IsDateString()
  @IsOptional()
  request_date?: string;

  @IsDateString()
  @IsOptional()
  required_date?: string;

  @IsDateString()
  @IsOptional()
  sent_date?: string;

  @IsString()
  @IsOptional()
  version?: string;

  @IsString()
  @IsOptional()
  reference?: string;

  @IsDateString()
  @IsOptional()
  next_followup?: string;

  @IsString()
  @IsOptional()
  remarks?: string;
}

export class ChangeProposalStatusDto {
  @IsString()
  @IsNotEmpty({ message: 'Status is required' })
  status!: string;

  @IsDateString()
  @IsOptional()
  sent_date?: string;

  @IsString()
  @IsOptional()
  lost_reason?: string;

  @IsString()
  @IsOptional()
  lost_remarks?: string;

  @IsString()
  @IsOptional()
  converted_to?: string;

  @IsString()
  @IsOptional()
  converted_reference?: string;

  @IsString()
  @IsOptional()
  remarks?: string;
}

export class CreateProposalFollowupDto {
  @IsDateString({}, { message: 'Follow-up date must be a valid YYYY-MM-DD string' })
  @IsOptional()
  followup_date?: string;

  @Matches(UUID_PATTERN, { message: 'Owner ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Follow-up owner is required' })
  owner_id!: string;

  @IsString()
  @IsNotEmpty({ message: 'Follow-up remarks are required' })
  remarks!: string;

  @IsString()
  @IsOptional()
  outcome?: string;

  @IsDateString({}, { message: 'Next follow-up date must be a valid YYYY-MM-DD string' })
  @IsOptional()
  next_followup_date?: string;
}

export class ProposalQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  sector?: string;

  @IsOptional()
  @IsString()
  sectorId?: string;

  @IsOptional()
  @Matches(UUID_PATTERN)
  responsible_id?: string;

  @IsOptional()
  @Matches(UUID_PATTERN)
  responsiblePersonId?: string;

  @IsOptional()
  @Matches(UUID_PATTERN)
  followup_owner_id?: string;

  @IsOptional()
  @Matches(UUID_PATTERN)
  followUpOwnerId?: string;

  @IsOptional()
  @IsString()
  @IsIn(['all', 'due_today', 'overdue', 'upcoming', 'no_followup', 'old_inactivity'])
  followup?: 'all' | 'due_today' | 'overdue' | 'upcoming' | 'no_followup' | 'old_inactivity';

  @IsOptional()
  @IsString()
  @IsIn(['all', 'due_today', 'overdue', 'upcoming', 'no_followup', 'old_inactivity'])
  followUp?: 'all' | 'due_today' | 'overdue' | 'upcoming' | 'no_followup' | 'old_inactivity';

  @IsOptional()
  @IsString()
  @IsIn(['updated_at', 'created_at', 'request_date', 'required_date', 'sent_date', 'next_followup', 'updatedAt', 'createdAt', 'requestDate', 'requiredDate', 'sentDate', 'nextFollowUp', 'nextFollowup'])
  sort_by?: string;

  @IsOptional()
  @IsString()
  @IsIn(['updated_at', 'created_at', 'request_date', 'required_date', 'sent_date', 'next_followup', 'updatedAt', 'createdAt', 'requestDate', 'requiredDate', 'sentDate', 'nextFollowUp', 'nextFollowup'])
  sortBy?: string;

  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc', 'ASC', 'DESC'])
  sort_order?: 'asc' | 'desc';

  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc', 'ASC', 'DESC'])
  sortOrder?: 'asc' | 'desc';

  @IsOptional()
  @IsDateString()
  from_date?: string;

  @IsOptional()
  @IsDateString()
  to_date?: string;

  @IsOptional()
  @IsString()
  @IsIn(['request_date', 'required_date', 'sent_date', 'next_followup', 'requestDate', 'requiredDate', 'sentDate', 'nextFollowup'])
  date_field?: 'request_date' | 'required_date' | 'sent_date' | 'next_followup';
}
