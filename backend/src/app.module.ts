import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { StudentsModule } from './students/students.module';
import { DocumentTypesModule } from './document-types/document-types.module';
import { DocumentsModule } from './documents/documents.module';
import { CertificationsModule } from './certifications/certifications.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    StudentsModule,
    DocumentTypesModule,
    DocumentsModule,
    CertificationsModule,
  ],
})
export class AppModule {}