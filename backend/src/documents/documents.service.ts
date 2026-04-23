import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DocumentStatus, Visibility } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { ReviewDocumentDto } from './dto/review-document.dto';
import { unlink } from 'fs/promises';

@Injectable()
export class DocumentsService {
  constructor(private prisma: PrismaService) {}

  private async getStudentOrThrow(userId: string) {
    const student = await this.prisma.student.findUnique({ where: { userId } });
    if (!student) throw new NotFoundException('Student profile not found');
    return student;
  }

  async upload(userId: string, dto: UploadDocumentDto, file: Express.Multer.File) {
    if (!file) throw new BadRequestException('File is required');

    const student = await this.getStudentOrThrow(userId);
    const docType = await this.prisma.documentType.findUnique({
      where: { id: dto.documentTypeId },
    });

    if (!docType) throw new NotFoundException('Document type not found');

    return this.prisma.studentDocument.create({
      data: {
        studentId: student.id,
        documentTypeId: dto.documentTypeId,
        fileName: file.originalname,
        filePath: file.path.replace(/\\/g, '/'),
        mimeType: file.mimetype,
        fileSize: file.size,
        visibility: dto.visibility ?? Visibility.SHARED,
      },
      include: { documentType: true },
    });
  }

  async getMyDocuments(userId: string) {
    const student = await this.getStudentOrThrow(userId);
    return this.prisma.studentDocument.findMany({
      where: { studentId: student.id },
      include: { documentType: true },
      orderBy: { uploadedAt: 'desc' },
    });
  }

  async updateVisibility(userId: string, documentId: string, visibility: Visibility) {
    const student = await this.getStudentOrThrow(userId);

    const document = await this.prisma.studentDocument.findUnique({
      where: { id: documentId },
    });

    if (!document || document.studentId !== student.id) {
      throw new NotFoundException('Document not found');
    }

    return this.prisma.studentDocument.update({
      where: { id: documentId },
      data: { visibility },
    });
  }

  async updateDocument(userId: string, documentId: string, dto: UpdateDocumentDto) {
    const student = await this.getStudentOrThrow(userId);
    const document = await this.prisma.studentDocument.findUnique({
      where: { id: documentId },
    });

    if (!document || document.studentId !== student.id) {
      throw new NotFoundException('Document not found');
    }

    if (dto.documentTypeId) {
      const docType = await this.prisma.documentType.findUnique({
        where: { id: dto.documentTypeId },
      });
      if (!docType) throw new NotFoundException('Document type not found');
    }

    return this.prisma.studentDocument.update({
      where: { id: documentId },
      data: {
        documentTypeId: dto.documentTypeId,
        visibility: dto.visibility,
      },
      include: { documentType: true },
    });
  }

  async deleteDocument(userId: string, documentId: string) {
    const student = await this.getStudentOrThrow(userId);
    const document = await this.prisma.studentDocument.findUnique({
      where: { id: documentId },
    });

    if (!document || document.studentId !== student.id) {
      throw new NotFoundException('Document not found');
    }

    await this.prisma.studentDocument.delete({ where: { id: documentId } });
    await unlink(document.filePath).catch(() => undefined);
    return { message: 'Document deleted' };
  }

  async reviewDocument(documentId: string, dto: ReviewDocumentDto) {
    const document = await this.prisma.studentDocument.findUnique({
      where: { id: documentId },
    });
    if (!document) throw new NotFoundException('Document not found');

    return this.prisma.studentDocument.update({
      where: { id: documentId },
      data: {
        status: dto.status as DocumentStatus,
        remarks: dto.remarks?.trim() || null,
      },
      include: { documentType: true },
    });
  }

  async replaceDocumentFile(
    userId: string,
    documentId: string,
    dto: UploadDocumentDto,
    file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('File is required');
    const student = await this.getStudentOrThrow(userId);
    const document = await this.prisma.studentDocument.findUnique({
      where: { id: documentId },
    });
    if (!document || document.studentId !== student.id) {
      throw new NotFoundException('Document not found');
    }
    const docTypeId = dto.documentTypeId || document.documentTypeId;
    const docType = await this.prisma.documentType.findUnique({ where: { id: docTypeId } });
    if (!docType) throw new NotFoundException('Document type not found');

    const updated = await this.prisma.studentDocument.update({
      where: { id: documentId },
      data: {
        documentTypeId: docTypeId,
        fileName: file.originalname,
        filePath: file.path.replace(/\\/g, '/'),
        mimeType: file.mimetype,
        fileSize: file.size,
        visibility: dto.visibility ?? document.visibility,
        status: DocumentStatus.PENDING,
        remarks: null,
      },
      include: { documentType: true },
    });

    await unlink(document.filePath).catch(() => undefined);
    return updated;
  }
}
