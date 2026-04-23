import {
  IsEmail,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateStudentDto {
  @IsString()
  rollNumber: string;

  @IsString()
  fullName: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsInt()
  batch: number;

  @IsString()
  branch: string;

  @IsOptional()
  @IsString()
  section?: string;

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

  @IsString()
  @MinLength(6)
  defaultPassword: string;
}