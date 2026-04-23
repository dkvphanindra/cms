import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateCertificationTypeDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsOptional()
  @IsBoolean()
  isMandatory?: boolean;
}
