import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AnnouncementsService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  async create(dto: CreateAnnouncementDto) {
    const announcement = await this.prisma.announcement.create({
      data: dto,
    });

    // Notify all students via email
    const students = await this.prisma.student.findMany({
      select: { email: true },
    });
    const emails = students.map((s) => s.email).filter((e): e is string => !!e);
    
    await this.mailService.sendAnnouncementNotification(emails, announcement);

    return announcement;
  }

  async findAll() {
    return this.prisma.announcement.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async delete(id: string) {
    return this.prisma.announcement.delete({
      where: { id },
    });
  }
}
