import { IsString, IsNotEmpty, IsUUID, IsOptional } from 'class-validator';

export class SignUploadDto {
  @IsString()
  @IsOptional()
  folder?: string;
}

export class AttachFileDto {
  @IsString()
  @IsNotEmpty({ message: 'Entity type is required' })
  entity_type!: string;

  @IsUUID('all')
  @IsNotEmpty({ message: 'Entity ID is required' })
  entity_id!: string;

  @IsString()
  @IsNotEmpty({ message: 'File URL is required' })
  file_url!: string;

  @IsString()
  @IsOptional()
  file_name?: string;
}
