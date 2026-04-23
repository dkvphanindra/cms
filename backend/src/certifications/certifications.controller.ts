import {
  Body,
  Controller,
  Delete,
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
import { DocumentStatus, Visibility } from '@prisma/client';
import { UpdateCertificationDto } from './dto/update-certification.dto';
import { ReviewCertificationDto } from './dto/review-certification.dto';

const certificationsUploadPath = './uploads/certifications';
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
    if (user.mustChangePass) {
      throw new ForbiddenException('Change password to continue');
    }
    return this.certificationsService.upload(user.sub, dto, file);
  }

  @Post(':id/replace')
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
  replaceCertification(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UploadCertificationDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (user.role !== 'STUDENT') {
      throw new ForbiddenException('Only students can replace certifications');
    }
    if (user.mustChangePass) {
      throw new ForbiddenException('Change password to continue');
    }
    return this.certificationsService.replaceCertificationFile(user.sub, id, dto, file);
  }

  @Get('me')
  getMyCertifications(@CurrentUser() user: any) {
    if (user.role !== 'STUDENT') {
      throw new ForbiddenException('Only students can access this');
    }
    if (user.mustChangePass) {
      throw new ForbiddenException('Change password to continue');
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
    if (user.mustChangePass) {
      throw new ForbiddenException('Change password to continue');
    }
    return this.certificationsService.updateVisibility(user.sub, id, visibility);
  }

  @Patch(':id')
  updateCertification(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateCertificationDto,
  ) {
    if (user.role !== 'STUDENT') {
      throw new ForbiddenException('Only students can edit certifications');
    }
    if (user.mustChangePass) {
      throw new ForbiddenException('Change password to continue');
    }
    return this.certificationsService.updateCertification(user.sub, id, dto);
  }

  @Delete(':id')
  deleteCertification(@CurrentUser() user: any, @Param('id') id: string) {
    if (user.role !== 'STUDENT') {
      throw new ForbiddenException('Only students can delete certifications');
    }
    if (user.mustChangePass) {
      throw new ForbiddenException('Change password to continue');
    }
    return this.certificationsService.deleteCertification(user.sub, id);
  }

  @Patch(':id/review')
  reviewCertification(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: ReviewCertificationDto) {
    if (user.role !== 'ADMIN') {
      throw new ForbiddenException('Only admin can review certifications');
    }
    if (dto.status !== DocumentStatus.APPROVED && dto.status !== DocumentStatus.REJECTED) {
      throw new ForbiddenException('Status should be APPROVED or REJECTED');
    }
    return this.certificationsService.reviewCertification(id, dto);
  }
}
