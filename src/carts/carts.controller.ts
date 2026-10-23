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

  @Get('me')
  @ApiOperation({
    summary: 'Get the active (non-expired) cart for the logged-in user, or null data',
  })
  async getMine(@CurrentUser() user: AuthenticatedUser): Promise<CartResponse | null> {
    return this.cartsService.getActive(user.id);
  }

  @Post('items')
  @ApiOperation({
    summary:
      'Add product to active cart. Creates a new cart (1-day TTL) if none is active.',
  })
  addItem(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AddCartItemDto,
  ): Promise<CartResponse> {
    return this.cartsService.addItem(user.id, dto);
  }

  @Patch('items/:itemId')
  @ApiOperation({ summary: 'Update quantity of an item in the active cart' })
  updateItem(
    @Param('itemId', ParseIntPipe) itemId: number,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateCartItemDto,
  ): Promise<CartResponse> {
    return this.cartsService.updateItem(user.id, itemId, dto);
  }

  @Delete('items/:itemId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove an item from the active cart' })
  removeItem(
    @Param('itemId', ParseIntPipe) itemId: number,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<CartResponse> {
    return this.cartsService.removeItem(user.id, itemId);
  }
}
