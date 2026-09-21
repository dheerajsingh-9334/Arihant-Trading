import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { MastersService } from './masters.service.js';
import { JwtAuthGuard } from '../../common/auth/jwt.guard.js';
import { RolesGuard } from '../../common/auth/roles.guard.js';

@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductsController {
  constructor(private readonly mastersService: MastersService) {}

  @Get()
  async getProducts(@Query('limit') limit?: number) {
    return this.mastersService.getProducts();
  }
}
