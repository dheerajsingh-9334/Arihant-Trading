import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsUUID,
} from 'class-validator';

export class CreateOrganisationDto {
  @IsString()
  @IsNotEmpty({ message: 'Organisation name is required' })
  name!: string;

  @IsString()
  @IsOptional()
  sector?: string;

  @IsBoolean()
  @IsOptional()
  is_govt?: boolean;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  state?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsUUID('all')
  @IsOptional()
  zone_id?: string;

  @IsUUID('all')
  @IsOptional()
  region_id?: string;
}

export class UpdateOrganisationDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  sector?: string;

  @IsBoolean()
  @IsOptional()
  is_govt?: boolean;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  state?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsUUID('all')
  @IsOptional()
  zone_id?: string;

  @IsUUID('all')
  @IsOptional()
  region_id?: string;
}
