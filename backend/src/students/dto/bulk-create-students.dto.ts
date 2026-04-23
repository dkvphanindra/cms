import { Type } from 'class-transformer';
import { ArrayMinSize, ValidateNested } from 'class-validator';
import { CreateStudentDto } from './create-student.dto';

export class BulkCreateStudentsDto {
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateStudentDto)
  students: CreateStudentDto[];
}
