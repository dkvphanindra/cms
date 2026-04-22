import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDocumentTypeDto } from './dto/create-document-type.dto';

@Injectable()
export class DocumentTypesService {
  constructor(private prisma: PrismaService) {}

  getAll(includeOptional = true) {
    return this.prisma.documentType.findMany({
      where: includeOptional ? undefined : { isMandatory: true },
      orderBy: [{ isMandatory: 'desc' }, { name: 'asc' }],
    });
  }

  create(dto: CreateDocumentTypeDto) {
    return this.prisma.documentType.create({ data: dto });
  }
}
