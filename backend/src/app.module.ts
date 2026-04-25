import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { StudentsModule } from './students/students.module';
import { DocumentTypesModule } from './document-types/document-types.module';
import { DocumentsModule } from './documents/documents.module';
import { CertificationsModule } from './certifications/certifications.module';
import { CertificationTypesModule } from './certification-types/certification-types.module';
import { MailModule } from './mail/mail.module';
import { AnnouncementsModule } from './announcements/announcements.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    StudentsModule,
    DocumentTypesModule,
    CertificationTypesModule,
    DocumentsModule,
    CertificationsModule,
    MailModule,
    AnnouncementsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}