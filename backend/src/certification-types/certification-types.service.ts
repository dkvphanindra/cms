import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCertificationTypeDto } from './dto/create-certification-type.dto';

@Injectable()
export class CertificationTypesService {
  constructor(private prisma: PrismaService) {}

  getAll(includeOptional = true) {
    return this.prisma.certificationType.findMany({
      where: includeOptional ? undefined : { isMandatory: true },
      orderBy: [{ isMandatory: 'desc' }, { name: 'asc' }],
    });
  }

  create(dto: CreateCertificationTypeDto) {
    return this.prisma.certificationType.create({ data: dto });
  }
}
