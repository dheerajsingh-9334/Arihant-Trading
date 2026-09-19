import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsDateString,
} from 'class-validator';

export class CreateInteractionDto {
  @IsUUID('all')
  @IsNotEmpty()
  organisation_id!: string;

  @IsUUID('all')
  @IsOptional()
  contact_id?: string;

  @IsUUID('all')
  @IsOptional()
  lead_id?: string;

  @IsString()
  @IsNotEmpty({ message: 'Interaction type is required (e.g. call, visit, demo, email)' })
  type!: string;

  @IsDateString()
  @IsOptional()
  occurred_on?: string;

  @IsString()
  @IsOptional()
  remarks?: string;

  @IsString()
  @IsOptional()
  outcome?: string;

  @IsString()
  @IsOptional()
  next_action?: string;

  @IsDateString()
  @IsOptional()
  followup_date?: string;
}
