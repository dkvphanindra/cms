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
  tenthMarks?: number;

  @IsOptional()
  @IsNumber()
  tenthPercentage?: number;

  @IsOptional()
  @IsNumber()
  interMarks?: number;

  @IsOptional()
  @IsNumber()
  interPercentage?: number;

  @IsOptional()
  @IsNumber()
  btechCgpa?: number;

  @IsOptional()
  @IsNumber()
  currentCgpa?: number;

  @IsOptional()
  @IsNumber()
  btechPercentage?: number;

  @IsOptional()
  @IsInt()
  backlogsCount?: number;
}