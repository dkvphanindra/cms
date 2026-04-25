import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStudentDto } from './dto/create-student.dto';
import * as bcrypt from 'bcrypt';
import { Role, Visibility } from '@prisma/client';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class StudentsService {
  constructor(private prisma: PrismaService) {}

  async createStudent(dto: CreateStudentDto) {
    const passwordHash = await bcrypt.hash(dto.defaultPassword, 10);

    const user = await this.prisma.user.create({
      data: {
        username: dto.rollNumber,
        passwordHash,
        role: Role.STUDENT,
        mustChangePass: true,
      },
    });

    const student = await this.prisma.student.create({
      data: {
        userId: user.id,
        rollNumber: dto.rollNumber,
        fullName: dto.fullName,
        email: dto.email,
        phone: dto.phone,
        batch: dto.batch,
        branch: dto.branch,
        section: dto.section,
        // Academic scores are intentionally filled by student after first login.
        backlogsCount: dto.backlogsCount || 0,
      },
    });

    return student;
  }

  async createStudentsBulk(students: CreateStudentDto[]) {
    const created: any[] = [];
    const failed: Array<{ rollNumber: string; reason: string }> = [];

    for (const dto of students) {
      try {
        const student = await this.createStudent(dto);
        created.push(student);
      } catch (error) {
        failed.push({
          rollNumber: dto.rollNumber,
          reason: (error as Error).message,
        });
      }
    }

    return {
      total: students.length,
      createdCount: created.length,
      failedCount: failed.length,
      created,
      failed,
    };
  }

  async getMyProfile(userId: string) {
    const student = await this.prisma.student.findUnique({
      where: { userId },
    });

    if (!student) throw new NotFoundException('Student not found');
    return student;
  }

  async updateMyProfile(userId: string, dto: UpdateProfileDto) {
    const student = await this.prisma.student.findUnique({
      where: { userId },
    });

    if (!student) throw new NotFoundException('Student not found');

    return this.prisma.student.update({
      where: { userId },
      data: dto,
    });
  }

  async getStudents(filters: any) {
    const where: any = {};

    // Basic filters
    if (filters.batch && filters.batch !== '') where.batch = Number(filters.batch);
    if (filters.branch && filters.branch !== '') where.branch = filters.branch;
    if (filters.section && filters.section !== '') where.section = filters.section;
    
    // Search filter
    if (filters.search && filters.search !== '') {
      where.OR = [
        { fullName: { contains: filters.search, mode: 'insensitive' } },
        { rollNumber: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    // Academic filters
    if (filters.minTenth && filters.minTenth !== '') {
      where.tenthPercentage = { gte: Number(filters.minTenth) };
    }
    if (filters.maxTenth && filters.maxTenth !== '') {
      where.tenthPercentage = {
        ...(where.tenthPercentage || {}),
        lte: Number(filters.maxTenth),
      };
    }
    if (filters.minInter && filters.minInter !== '') {
      where.interPercentage = { gte: Number(filters.minInter) };
    }
    if (filters.maxInter && filters.maxInter !== '') {
      where.interPercentage = {
        ...(where.interPercentage || {}),
        lte: Number(filters.maxInter),
      };
    }
    if (filters.minBtechCgpa && filters.minBtechCgpa !== '') {
      where.btechCgpa = { gte: Number(filters.minBtechCgpa) };
    }
    if (filters.maxBacklogs && filters.maxBacklogs !== '') {
      where.backlogsCount = { lte: Number(filters.maxBacklogs) };
    }

    // Certification filter
    if (filters.certification && filters.certification !== '') {
      where.certifications = {
        some: {
          visibility: Visibility.SHARED,
          OR: [
            { title: { contains: filters.certification, mode: 'insensitive' } },
            { provider: { contains: filters.certification, mode: 'insensitive' } },
            { category: { contains: filters.certification, mode: 'insensitive' } },
          ],
        },
      };
    }

    return this.prisma.student.findMany({
      where,
      include: {
        certifications: {
          where: { visibility: Visibility.SHARED },
        },
      },
      orderBy: { rollNumber: 'asc' },
    });
  }

  async updateStudent(id: string, dto: any) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!student) throw new NotFoundException('Student not found');

    const { newPassword, rollNumber, ...studentData } = dto;

    // If password is being updated
    if (newPassword) {
      const passwordHash = await bcrypt.hash(newPassword, 10);
      await this.prisma.user.update({
        where: { id: student.userId },
        data: { passwordHash },
      });
    }

    // If roll number is being updated, also update username in user table
    if (rollNumber && rollNumber !== student.rollNumber) {
      await this.prisma.user.update({
        where: { id: student.userId },
        data: { username: rollNumber },
      });
      studentData.rollNumber = rollNumber;
    }

    return this.prisma.student.update({
      where: { id },
      data: studentData,
    });
  }

  async deleteStudent(id: string) {
    const student = await this.prisma.student.findUnique({
      where: { id },
    });

    if (!student) throw new NotFoundException('Student not found');

    // Deleting the user will also delete the student due to onDelete: Cascade
    await this.prisma.user.delete({
      where: { id: student.userId },
    });

    return { message: 'Student deleted successfully' };
  }

  async getStudentById(studentId: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        documents: {
          include: { documentType: true },
        },
        certifications: {
          include: { certificationType: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!student) throw new NotFoundException('Student not found');
    return student;
  }
}