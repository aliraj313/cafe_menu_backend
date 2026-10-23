import { Module } from '@nestjs/common';
import { ProductsModule } from '../products/products.module';
import { CartsController } from './carts.controller';
import { CartsRepository } from './carts.repository';
import { CartsService } from './carts.service';

@Module({
  imports: [ProductsModule],
  controllers: [CartsController],
  providers: [CartsService, CartsRepository],
  exports: [CartsService, CartsRepository],
})
export class CartsModule {}
