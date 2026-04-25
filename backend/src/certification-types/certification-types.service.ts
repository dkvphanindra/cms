import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCertificationTypeDto } from './dto/create-certification-type.dto';
import { MailService } from '../mail/mail.service';

@Injectable()
export class CertificationTypesService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  getAll(includeOptional = true) {
    return this.prisma.certificationType.findMany({
      where: includeOptional ? undefined : { isMandatory: true },
      orderBy: [{ isMandatory: 'desc' }, { name: 'asc' }],
    });
  }

  async create(dto: CreateCertificationTypeDto) {
    const certType = await this.prisma.certificationType.create({ data: dto });

    // Notify all students
    const students = await this.prisma.student.findMany({
      select: { email: true },
    });
    const emails = students.map((s) => s.email).filter((e): e is string => !!e);
    
    await this.mailService.sendUploadSectionNotification(emails, certType.name);

    return certType;
  }
}
