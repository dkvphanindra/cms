import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CertificationTypesService } from './certification-types.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateCertificationTypeDto } from './dto/create-certification-type.dto';

@Controller('certification-types')
@UseGuards(JwtAuthGuard)
export class CertificationTypesController {
  constructor(private readonly certificationTypesService: CertificationTypesService) {}

  @Get()
  getCertificationTypes(@Query('mandatoryOnly') mandatoryOnly?: string) {
    const includeOptional = mandatoryOnly !== 'true';
    return this.certificationTypesService.getAll(includeOptional);
  }

  @Post()
  createCertificationType(@CurrentUser() user: any, @Body() dto: CreateCertificationTypeDto) {
    if (user.role !== 'ADMIN') {
      throw new ForbiddenException('Only admin can create certification types');
    }
    return this.certificationTypesService.create(dto);
  }
}
