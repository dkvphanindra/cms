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
import { DocumentsService } from './documents.service';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { DocumentStatus, Visibility } from '@prisma/client';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { ReviewDocumentDto } from './dto/review-document.dto';

const documentsUploadPath = './uploads/documents';
mkdirSync(documentsUploadPath, { recursive: true });

@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: documentsUploadPath,
        filename: (_req, file, cb) => {
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  uploadDocument(
    @CurrentUser() user: any,
    @Body() dto: UploadDocumentDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (user.role !== 'STUDENT') {
      throw new ForbiddenException('Only students can upload documents');
    }
    if (user.mustChangePass) {
      throw new ForbiddenException('Change password to continue');
    }
    return this.documentsService.upload(user.sub, dto, file);
  }

  @Post(':id/replace')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: documentsUploadPath,
        filename: (_req, file, cb) => {
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  replaceDocument(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UploadDocumentDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (user.role !== 'STUDENT') {
      throw new ForbiddenException('Only students can replace documents');
    }
    if (user.mustChangePass) {
      throw new ForbiddenException('Change password to continue');
    }
    return this.documentsService.replaceDocumentFile(user.sub, id, dto, file);
  }

  @Get('me')
  getMyDocuments(@CurrentUser() user: any) {
    if (user.role !== 'STUDENT') {
      throw new ForbiddenException('Only students can access this');
    }
    if (user.mustChangePass) {
      throw new ForbiddenException('Change password to continue');
    }
    return this.documentsService.getMyDocuments(user.sub);
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
    return this.documentsService.updateVisibility(user.sub, id, visibility);
  }

  @Patch(':id')
  updateDocument(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: UpdateDocumentDto) {
    if (user.role !== 'STUDENT') {
      throw new ForbiddenException('Only students can edit documents');
    }
    if (user.mustChangePass) {
      throw new ForbiddenException('Change password to continue');
    }
    return this.documentsService.updateDocument(user.sub, id, dto);
  }

  @Delete(':id')
  deleteDocument(@CurrentUser() user: any, @Param('id') id: string) {
    if (user.role !== 'STUDENT') {
      throw new ForbiddenException('Only students can delete documents');
    }
    if (user.mustChangePass) {
      throw new ForbiddenException('Change password to continue');
    }
    return this.documentsService.deleteDocument(user.sub, id);
  }

  @Patch(':id/review')
  reviewDocument(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: ReviewDocumentDto) {
    if (user.role !== 'ADMIN') {
      throw new ForbiddenException('Only admin can review documents');
    }
    if (dto.status !== DocumentStatus.APPROVED && dto.status !== DocumentStatus.REJECTED) {
      throw new ForbiddenException('Status should be APPROVED or REJECTED');
    }
    return this.documentsService.reviewDocument(id, dto);
  }
}
