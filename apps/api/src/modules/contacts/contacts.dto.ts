import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsBoolean,
  IsUUID,
} from 'class-validator';

export class CreateContactDto {
  @IsUUID('all')
  @IsNotEmpty()
  organisation_id!: string;

  @IsString()
  @IsNotEmpty({ message: 'Full name is required' })
  full_name!: string;

  @IsString()
  @IsOptional()
  designation?: string;

  @IsString()
  @IsOptional()
  mobile?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsBoolean()
  @IsOptional()
  is_primary?: boolean;
}

export class UpdateContactDto {
  @IsString()
  @IsOptional()
  full_name?: string;

  @IsString()
  @IsOptional()
  designation?: string;

  @IsString()
  @IsOptional()
  mobile?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsBoolean()
  @IsOptional()
  is_primary?: boolean;
}
