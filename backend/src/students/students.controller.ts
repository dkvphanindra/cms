import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { StudentsService } from './students.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { BulkCreateStudentsDto } from './dto/bulk-create-students.dto';

@Controller('students')
@UseGuards(JwtAuthGuard)
export class StudentsController {
  constructor(private studentsService: StudentsService) {}

  @Post()
  createStudent(@CurrentUser() user: any, @Body() dto: CreateStudentDto) {
    if (user.role !== 'ADMIN') {
      throw new ForbiddenException('Only admin can create students');
    }
    return this.studentsService.createStudent(dto);
  }

  @Post('bulk')
  createStudentsBulk(@CurrentUser() user: any, @Body() dto: BulkCreateStudentsDto) {
    if (user.role !== 'ADMIN') {
      throw new ForbiddenException('Only admin can create students');
    }
    return this.studentsService.createStudentsBulk(dto.students);
  }

  @Get('me')
  getMyProfile(@CurrentUser() user: any) {
    if (user.role !== 'STUDENT') {
      throw new ForbiddenException('Only students can access this');
    }
    if (user.mustChangePass) {
      throw new ForbiddenException('Change password to continue');
    }
    return this.studentsService.getMyProfile(user.sub);
  }

  @Patch('me')
  updateMyProfile(@CurrentUser() user: any, @Body() dto: UpdateProfileDto) {
    if (user.role !== 'STUDENT') {
      throw new ForbiddenException('Only students can update profile');
    }
    if (user.mustChangePass) {
      throw new ForbiddenException('Change password to continue');
    }
    return this.studentsService.updateMyProfile(user.sub, dto);
  }

  @Get()
  getStudents(@CurrentUser() user: any, @Query() query: any) {
    if (user.role !== 'ADMIN') {
      throw new ForbiddenException('Only admin can view students');
    }
    return this.studentsService.getStudents(query);
  }

  @Get(':id')
  getStudentById(@CurrentUser() user: any, @Param('id') id: string) {
    if (user.role !== 'ADMIN') {
      throw new ForbiddenException('Only admin can view student details');
    }
    return this.studentsService.getStudentById(id);
  }
}