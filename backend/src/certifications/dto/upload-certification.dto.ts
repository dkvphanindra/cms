import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { Visibility } from '@prisma/client';

export class UploadCertificationDto {
  @IsOptional()
  @IsString()
  certificationTypeId?: string;

  @IsOptional()
  @IsString()
  requirement?: string;

  @IsString()
  title: string;

  @IsString()
  provider: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsDateString()
  issueDate?: string;

  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @IsOptional()
  @IsString()
  credentialId?: string;

  @IsOptional()
  @IsString()
  verificationUrl?: string;

  @IsOptional()
  @IsEnum(Visibility)
  visibility?: Visibility;
}
