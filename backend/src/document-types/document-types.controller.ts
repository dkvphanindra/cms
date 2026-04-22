import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { DocumentTypesService } from './document-types.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateDocumentTypeDto } from './dto/create-document-type.dto';

@Controller('document-types')
@UseGuards(JwtAuthGuard)
export class DocumentTypesController {
  constructor(private readonly documentTypesService: DocumentTypesService) {}

  @Get()
  getDocumentTypes(@Query('mandatoryOnly') mandatoryOnly?: string) {
    const includeOptional = mandatoryOnly !== 'true';
    return this.documentTypesService.getAll(includeOptional);
  }

  @Post()
  createDocumentType(@CurrentUser() user: any, @Body() dto: CreateDocumentTypeDto) {
    if (user.role !== 'ADMIN') {
      throw new ForbiddenException('Only admin can create document types');
    }
    return this.documentTypesService.create(dto);
  }
}
