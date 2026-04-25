import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Visibility } from '@prisma/client';

export class UploadDocumentDto {
  @IsString()
  documentTypeId: string;

  @IsOptional()
  @IsString()
  requirement?: string;

  @IsOptional()
  @IsEnum(Visibility)
  visibility?: Visibility;
}
