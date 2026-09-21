import { Module } from '@nestjs/common';
import { MastersService } from './masters.service.js';
import { MastersController } from './masters.controller.js';
import { ProductsController } from './products.controller.js';

@Module({
  controllers: [MastersController, ProductsController],
  providers: [MastersService],
  exports: [MastersService],
})
export class MastersModule {}
