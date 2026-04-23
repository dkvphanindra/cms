import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Visibility } from '@prisma/client';

export class UpdateDocumentDto {
  @IsOptional()
  @IsString()
  documentTypeId?: string;

  @IsOptional()
  @IsEnum(Visibility)
  visibility?: Visibility;
}
