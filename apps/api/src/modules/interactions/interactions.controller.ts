import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { InteractionsService } from './interactions.service.js';
import { CreateInteractionDto } from './interactions.dto.js';
import { JwtAuthGuard } from '../../common/auth/jwt.guard.js';
import { RolesGuard } from '../../common/auth/roles.guard.js';
import { CurrentUser } from '../../common/auth/current-user.decorator.js';
import type { AuthUser } from '@arihant/shared';

@Controller('interactions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InteractionsController {
  constructor(private readonly interactionsService: InteractionsService) {}

  @Get()
  async findByOrganisation(@Query('organisation_id') orgId: string) {
    return this.interactionsService.findByOrganisation(orgId);
  }

  @Post()
  async create(@Body() dto: CreateInteractionDto, @CurrentUser() user: AuthUser) {
    return this.interactionsService.create(dto, user.id);
  }
}
