import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsDateString,
  IsEnum,
} from 'class-validator';
import type { ProposalStatus } from '@arihant/shared';

export class CreateProposalDto {
  @IsUUID('all')
  @IsNotEmpty({ message: 'Organisation is required' })
  organisation_id!: string;

  @IsUUID('all')
  @IsOptional()
  lead_id?: string;

  @IsUUID('all')
  @IsOptional()
  product_id?: string;

  @IsString()
  @IsOptional()
  sector?: string;

  @IsUUID('all')
  @IsOptional()
  responsible_id?: string;

  @IsUUID('all')
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

  @IsEnum([
    'requested',
    'under_preparation',
    'ready_for_review',
    'approved',
    'sent',
    'followup_required',
    'converted',
    'closed',
    'lost',
  ] as const)
  @IsOptional()
  status?: ProposalStatus;

  @IsDateString()
  @IsOptional()
  next_followup?: string;

  @IsString()
  @IsOptional()
  remarks?: string;
}

export class UpdateProposalDto {
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

  @IsEnum([
    'requested',
    'under_preparation',
    'ready_for_review',
    'approved',
    'sent',
    'followup_required',
    'converted',
    'closed',
    'lost',
  ] as const)
  @IsOptional()
  status?: ProposalStatus;

  @IsDateString()
  @IsOptional()
  next_followup?: string;

  @IsString()
  @IsOptional()
  remarks?: string;
}
