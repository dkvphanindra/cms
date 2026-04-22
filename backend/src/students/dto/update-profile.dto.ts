import { IsEmail, IsNumber, IsOptional, IsString, IsInt } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsNumber()
  tenthPercentage?: number;

  @IsOptional()
  @IsNumber()
  interPercentage?: number;

  @IsOptional()
  @IsNumber()
  currentCgpa?: number;

  @IsOptional()
  @IsInt()
  backlogsCount?: number;
}