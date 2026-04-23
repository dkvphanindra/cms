import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UploadCertificationDto } from './dto/upload-certification.dto';
import { DocumentStatus, Visibility } from '@prisma/client';
import { UpdateCertificationDto } from './dto/update-certification.dto';
import { ReviewCertificationDto } from './dto/review-certification.dto';
import { unlink } from 'fs/promises';

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
    if (dto.certificationTypeId) {
      const certType = await this.prisma.certificationType.findUnique({
        where: { id: dto.certificationTypeId },
      });
      if (!certType) throw new NotFoundException('Certification field not found');
    }
    return this.prisma.certification.create({
      data: {
        studentId: student.id,
        certificationTypeId: dto.certificationTypeId,
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
      include: { certificationType: true },
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

  async updateCertification(userId: string, certificationId: string, dto: UpdateCertificationDto) {
    const student = await this.getStudentOrThrow(userId);
    const cert = await this.prisma.certification.findUnique({
      where: { id: certificationId },
    });

    if (!cert || cert.studentId !== student.id) {
      throw new NotFoundException('Certification not found');
    }

    return this.prisma.certification.update({
      where: { id: certificationId },
      data: {
        title: dto.title,
        provider: dto.provider,
        category: dto.category,
        issueDate: dto.issueDate ? new Date(dto.issueDate) : undefined,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
        credentialId: dto.credentialId,
        verificationUrl: dto.verificationUrl,
        visibility: dto.visibility,
      },
    });
  }

  async deleteCertification(userId: string, certificationId: string) {
    const student = await this.getStudentOrThrow(userId);
    const cert = await this.prisma.certification.findUnique({
      where: { id: certificationId },
    });

    if (!cert || cert.studentId !== student.id) {
      throw new NotFoundException('Certification not found');
    }

    await this.prisma.certification.delete({ where: { id: certificationId } });
    await unlink(cert.filePath).catch(() => undefined);
    return { message: 'Certification deleted' };
  }

  async reviewCertification(certificationId: string, dto: ReviewCertificationDto) {
    const cert = await this.prisma.certification.findUnique({
      where: { id: certificationId },
    });
    if (!cert) throw new NotFoundException('Certification not found');

    return this.prisma.certification.update({
      where: { id: certificationId },
      data: {
        status: dto.status as DocumentStatus,
        remarks: dto.remarks?.trim() || null,
      },
      include: { certificationType: true },
    });
  }

  async replaceCertificationFile(
    userId: string,
    certificationId: string,
    dto: UploadCertificationDto,
    file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('File is required');
    const student = await this.getStudentOrThrow(userId);
    const cert = await this.prisma.certification.findUnique({
      where: { id: certificationId },
    });

    if (!cert || cert.studentId !== student.id) {
      throw new NotFoundException('Certification not found');
    }

    if (dto.certificationTypeId) {
      const certType = await this.prisma.certificationType.findUnique({
        where: { id: dto.certificationTypeId },
      });
      if (!certType) throw new NotFoundException('Certification field not found');
    }

    const updated = await this.prisma.certification.update({
      where: { id: certificationId },
      data: {
        certificationTypeId: dto.certificationTypeId ?? cert.certificationTypeId,
        title: dto.title || cert.title,
        provider: dto.provider || cert.provider,
        category: dto.category,
        issueDate: dto.issueDate ? new Date(dto.issueDate) : cert.issueDate,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : cert.expiryDate,
        credentialId: dto.credentialId,
        verificationUrl: dto.verificationUrl,
        fileName: file.originalname,
        filePath: file.path.replace(/\\/g, '/'),
        mimeType: file.mimetype,
        fileSize: file.size,
        visibility: dto.visibility ?? cert.visibility,
        status: DocumentStatus.PENDING,
        remarks: null,
      },
      include: { certificationType: true },
    });

    await unlink(cert.filePath).catch(() => undefined);
    return updated;
  }
}
