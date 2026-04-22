import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UploadCertificationDto } from './dto/upload-certification.dto';
import { Visibility } from '@prisma/client';

@Injectable()
export class CertificationsService {
  constructor(private prisma: PrismaService) {}

  private async getStudentOrThrow(userId: string) {
    const student = await this.prisma.student.findUnique({ where: { userId } });
    if (!student) throw new NotFoundException('Student profile not found');
    return student;
  }

  async upload(userId: string, dto: UploadCertificationDto, file: Express.Multer.File) {
    if (!file) throw new BadRequestException('File is required');

    const student = await this.getStudentOrThrow(userId);
    return this.prisma.certification.create({
      data: {
        studentId: student.id,
        title: dto.title,
        provider: dto.provider,
        category: dto.category,
        issueDate: dto.issueDate ? new Date(dto.issueDate) : undefined,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
        credentialId: dto.credentialId,
        verificationUrl: dto.verificationUrl,
        fileName: file.originalname,
        filePath: file.path.replace(/\\/g, '/'),
        mimeType: file.mimetype,
        fileSize: file.size,
        visibility: dto.visibility ?? Visibility.SHARED,
      },
    });
  }

  async getMyCertifications(userId: string) {
    const student = await this.getStudentOrThrow(userId);
    return this.prisma.certification.findMany({
      where: { studentId: student.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateVisibility(userId: string, certificationId: string, visibility: Visibility) {
    const student = await this.getStudentOrThrow(userId);
    const cert = await this.prisma.certification.findUnique({
      where: { id: certificationId },
    });

    if (!cert || cert.studentId !== student.id) {
      throw new NotFoundException('Certification not found');
    }

    return this.prisma.certification.update({
      where: { id: certificationId },
      data: { visibility },
    });
  }
}
