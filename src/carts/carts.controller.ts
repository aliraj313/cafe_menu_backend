import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { CartResponse } from './cart.mapper';
import { CartsService } from './carts.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@ApiTags('carts')
@Public()
@Controller('carts')
export class CartsController {
  constructor(private readonly cartsService: CartsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new shopping cart' })
  create(): Promise<CartResponse> {
    return this.cartsService.create();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get cart by id' })
  get(@Param('id', ParseIntPipe) id: number): Promise<CartResponse> {
    return this.cartsService.get(id);
  }

  @Post(':id/items')
  @ApiOperation({ summary: 'Add a product to the cart (or increase quantity)' })
  addItem(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AddCartItemDto,
  ): Promise<CartResponse> {
    return this.cartsService.addItem(id, dto);
  }

  @Patch(':id/items/:itemId')
  @ApiOperation({ summary: 'Update quantity of a cart item' })
  updateItem(
    @Param('id', ParseIntPipe) id: number,
    @Param('itemId', ParseIntPipe) itemId: number,
    @Body() dto: UpdateCartItemDto,
  ): Promise<CartResponse> {
    return this.cartsService.updateItem(id, itemId, dto);
  }

  @Delete(':id/items/:itemId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove an item from the cart' })
  removeItem(
    @Param('id', ParseIntPipe) id: number,
    @Param('itemId', ParseIntPipe) itemId: number,
  ): Promise<CartResponse> {
    return this.cartsService.removeItem(id, itemId);
  }
}
