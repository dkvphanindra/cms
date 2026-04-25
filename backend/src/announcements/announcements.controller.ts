import { Body, Controller, Delete, Get, Param, Post, UseGuards, ForbiddenException } from '@nestjs/common';
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('announcements')
@UseGuards(JwtAuthGuard)
export class AnnouncementsController {
  constructor(private announcementsService: AnnouncementsService) {}

  @Post()
  create(@CurrentUser() user: any, @Body() dto: CreateAnnouncementDto) {
    if (user.role !== 'ADMIN') {
      throw new ForbiddenException('Only admin can create announcements');
    }
    return this.announcementsService.create(dto);
  }

  @Get()
  findAll() {
    return this.announcementsService.findAll();
  }

  @Delete(':id')
  delete(@CurrentUser() user: any, @Param('id') id: string) {
    if (user.role !== 'ADMIN') {
      throw new ForbiddenException('Only admin can delete announcements');
    }
    return this.announcementsService.delete(id);
  }
}
