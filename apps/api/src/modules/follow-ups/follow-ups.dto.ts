import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  Matches,
} from 'class-validator';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class CreateFollowUpDto {
  @Matches(UUID_PATTERN, { message: 'Organisation ID must be a valid UUID' })
  @IsNotEmpty()
  organisation_id!: string;

  @Matches(UUID_PATTERN, { message: 'Contact ID must be a valid UUID' })
  @IsOptional()
  contact_id?: string;

  @Matches(UUID_PATTERN, { message: 'Lead ID must be a valid UUID' })
  @IsOptional()
  lead_id?: string;

  @Matches(UUID_PATTERN, { message: 'Interaction ID must be a valid UUID' })
  @IsOptional()
  interaction_id?: string;

  @Matches(UUID_PATTERN, { message: 'Assigned user must be a valid UUID' })
  @IsNotEmpty()
  assigned_to!: string;

  @IsDateString()
  @IsNotEmpty()
  due_date!: string;

  @IsString()
  @IsOptional()
  remarks?: string;
}

export class CompleteFollowUpDto {
  @IsString()
  @IsNotEmpty({ message: 'Outcome is required to complete follow-up' })
  outcome!: string;

  @IsString()
  @IsOptional()
  remarks?: string;

  @IsDateString()
  @IsOptional()
  next_followup_date?: string;
}

export class RescheduleFollowUpDto {
  @IsDateString()
  @IsNotEmpty({ message: 'New due date is required' })
  new_due_date!: string;

  @IsString()
  @IsOptional()
  reason?: string;
}

export class CancelFollowUpDto {
  @IsString()
  @IsOptional()
  reason?: string;
}
