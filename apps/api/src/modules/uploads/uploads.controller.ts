import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { UploadsService } from './uploads.service.js';
import { AttachFileDto, SignUploadDto } from './uploads.dto.js';
import { JwtAuthGuard } from '../../common/auth/jwt.guard.js';
import { CurrentUser } from '../../common/auth/current-user.decorator.js';
import type { AuthUser } from '@arihant/shared';

@Controller('uploads')
@UseGuards(JwtAuthGuard)
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('sign')
  getSignParameters(@Body() dto?: SignUploadDto) {
    return this.uploadsService.getSignParameters(dto?.folder);
  }

  @Post('attach')
  async attachFile(@Body() dto: AttachFileDto, @CurrentUser() user: AuthUser) {
    return this.uploadsService.attachFile(dto, user);
  }

  @Get('attachments')
  async getAttachments(
    @Query('entity_type') entityType: string,
    @Query('entity_id') entityId: string,
  ) {
    return this.uploadsService.getAttachments(entityType, entityId);
  }
}
