import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';
import { UpdateType } from '@prisma/client';

export class CreateAnnouncementDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsEnum(UpdateType)
  type: UpdateType;

  @IsOptional()
  @IsUrl()
  link?: string;

  @IsOptional()
  expiresAt?: Date;
}
