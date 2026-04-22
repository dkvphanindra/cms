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
import { DocumentsService } from './documents.service';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { Visibility } from '@prisma/client';

const documentsUploadPath = 'uploads/documents';
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
    return this.documentsService.upload(user.sub, dto, file);
  }

  @Get('me')
  getMyDocuments(@CurrentUser() user: any) {
    if (user.role !== 'STUDENT') {
      throw new ForbiddenException('Only students can access this');
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
    return this.documentsService.updateVisibility(user.sub, id, visibility);
  }
}
