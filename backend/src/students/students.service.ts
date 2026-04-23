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

    if (filters.batch) where.batch = Number(filters.batch);
    if (filters.branch) where.branch = filters.branch;
    if (filters.section) where.section = filters.section;
    if (filters.minTenth) {
      where.tenthPercentage = { gte: Number(filters.minTenth) };
    }
    if (filters.maxTenth) {
      where.tenthPercentage = {
        ...(where.tenthPercentage || {}),
        lte: Number(filters.maxTenth),
      };
    }
    if (filters.minInter) {
      where.interPercentage = { gte: Number(filters.minInter) };
    }
    if (filters.maxInter) {
      where.interPercentage = {
        ...(where.interPercentage || {}),
        lte: Number(filters.maxInter),
      };
    }
    if (filters.minBtechCgpa) {
      where.btechCgpa = { gte: Number(filters.minBtechCgpa) };
    }
    if (filters.maxBacklogs) {
      where.backlogsCount = { lte: Number(filters.maxBacklogs) };
    }

    if (filters.certification) {
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