import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseEnumPipe,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { mkdirSync } from 'fs';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CertificationsService } from './certifications.service';
import { UploadCertificationDto } from './dto/upload-certification.dto';
import { Visibility } from '@prisma/client';

const certificationsUploadPath = 'uploads/certifications';
mkdirSync(certificationsUploadPath, { recursive: true });

@Controller('certifications')
@UseGuards(JwtAuthGuard)
export class CertificationsController {
  constructor(private readonly certificationsService: CertificationsService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: certificationsUploadPath,
        filename: (_req, file, cb) => {
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  uploadCertification(
    @CurrentUser() user: any,
    @Body() dto: UploadCertificationDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (user.role !== 'STUDENT') {
      throw new ForbiddenException('Only students can upload certifications');
    }
    return this.certificationsService.upload(user.sub, dto, file);
  }

  @Get('me')
  getMyCertifications(@CurrentUser() user: any) {
    if (user.role !== 'STUDENT') {
      throw new ForbiddenException('Only students can access this');
    }
    return this.certificationsService.getMyCertifications(user.sub);
  }

  @Patch(':id/visibility/:visibility')
  updateVisibility(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Param('visibility', new ParseEnumPipe(Visibility)) visibility: Visibility,
  ) {
    if (user.role !== 'STUDENT') {
      throw new ForbiddenException('Only students can update visibility');
    }
    return this.certificationsService.updateVisibility(user.sub, id, visibility);
  }
}
