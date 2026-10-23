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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../auth/decorators/current-user.decorator';
import { CartResponse } from './cart.mapper';
import { CartsService } from './carts.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@ApiTags('carts')
@ApiBearerAuth()
@Controller('carts')
export class CartsController {
  constructor(private readonly cartsService: CartsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new shopping cart for the logged-in user' })
  create(@CurrentUser() user: AuthenticatedUser): Promise<CartResponse> {
    return this.cartsService.create(user.id);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get or create the current user cart' })
  getMine(@CurrentUser() user: AuthenticatedUser): Promise<CartResponse> {
    return this.cartsService.getOrCreateForUser(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get cart by id (owner only)' })
  get(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<CartResponse> {
    return this.cartsService.get(id, user.id);
  }

  @Post(':id/items')
  @ApiOperation({ summary: 'Add a product to the cart' })
  addItem(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AddCartItemDto,
  ): Promise<CartResponse> {
    return this.cartsService.addItem(id, user.id, dto);
  }

  @Patch(':id/items/:itemId')
  @ApiOperation({ summary: 'Update quantity of a cart item' })
  updateItem(
    @Param('id', ParseIntPipe) id: number,
    @Param('itemId', ParseIntPipe) itemId: number,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateCartItemDto,
  ): Promise<CartResponse> {
    return this.cartsService.updateItem(id, itemId, user.id, dto);
  }

  @Delete(':id/items/:itemId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove an item from the cart' })
  removeItem(
    @Param('id', ParseIntPipe) id: number,
    @Param('itemId', ParseIntPipe) itemId: number,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<CartResponse> {
    return this.cartsService.removeItem(id, itemId, user.id);
  }
}
