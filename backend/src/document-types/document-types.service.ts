import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDocumentTypeDto } from './dto/create-document-type.dto';
import { MailService } from '../mail/mail.service';

@Injectable()
export class DocumentTypesService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  getAll(includeOptional = true) {
    return this.prisma.documentType.findMany({
      where: includeOptional ? undefined : { isMandatory: true },
      orderBy: [{ isMandatory: 'desc' }, { name: 'asc' }],
    });
  }

  async create(dto: CreateDocumentTypeDto) {
    const docType = await this.prisma.documentType.create({ data: dto });

    // Notify all students
    const students = await this.prisma.student.findMany({
      select: { email: true },
    });
    const emails = students.map((s) => s.email).filter((e): e is string => !!e);
    
    await this.mailService.sendUploadSectionNotification(emails, docType.name);

    return docType;
  }
}
