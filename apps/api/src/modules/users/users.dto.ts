import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsUUID,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import type { UserRole } from '@arihant/shared';
import { USER_ROLES } from '@arihant/shared';

export class CreateUserDto {
  @IsEmail({}, { message: 'Valid email is required' })
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty({ message: 'Full name is required' })
  full_name!: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEnum(USER_ROLES, { message: 'Invalid role' })
  role!: UserRole;

  @IsUUID('all', { message: 'Invalid region ID' })
  @IsOptional()
  region_id?: string;

  @IsUUID('all', { message: 'Invalid zone ID' })
  @IsOptional()
  zone_id?: string;

  @IsUUID('all', { message: 'Invalid manager ID' })
  @IsOptional()
  reporting_manager_id?: string;

  @IsString()
  @IsOptional()
  password?: string;
}

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  full_name?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEnum(USER_ROLES)
  @IsOptional()
  role?: UserRole;

  @IsUUID('all')
  @IsOptional()
  region_id?: string | null;

  @IsUUID('all')
  @IsOptional()
  zone_id?: string | null;

  @IsUUID('all')
  @IsOptional()
  reporting_manager_id?: string | null;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}

export class BulkInviteUserItemDto {
  @IsEmail()
  email!: string;

  @IsString()
  full_name!: string;

  @IsEnum(USER_ROLES)
  role!: UserRole;

  @IsOptional()
  region_name?: string;

  @IsOptional()
  manager_email?: string;
}

export class BulkInviteUsersDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkInviteUserItemDto)
  users!: BulkInviteUserItemDto[];
}
