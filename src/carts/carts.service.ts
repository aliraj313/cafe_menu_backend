import { Injectable } from '@nestjs/common';
import {
  BusinessRuleException,
  NotFoundException,
} from '../common/exceptions/app.exception';
import { ConfigsService } from '../config/configs.service';
import { ProductsRepository } from '../products/products.repository';
import { CartResponse, toCartResponse } from './cart.mapper';
import { CartsRepository } from './carts.repository';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Injectable()
export class CartsService {
  constructor(
    private readonly cartsRepository: CartsRepository,
    private readonly productsRepository: ProductsRepository,
    private readonly configs: ConfigsService,
  ) {}

  async create(): Promise<CartResponse> {
    const cart = await this.cartsRepository.create();
    return toCartResponse(cart);
  }

  async get(cartId: number): Promise<CartResponse> {
    const cart = await this.requireCart(cartId);
    return toCartResponse(cart);
  }

  async addItem(cartId: number, dto: AddCartItemDto): Promise<CartResponse> {
    await this.requireCart(cartId);
    this.assertQuantity(dto.quantity);

    const product = await this.productsRepository.findById(dto.productId);
    if (!product) {
      throw new NotFoundException('PRODUCT_NOT_FOUND', 'Product was not found.');
    }
    if (!product.isAvailable) {
      throw new BusinessRuleException(
        'PRODUCT_UNAVAILABLE',
        'This product is not available for ordering.',
      );
    }

    const existing = await this.cartsRepository.findItemByProduct(cartId, dto.productId);
    if (existing) {
      const nextQuantity = existing.quantity + dto.quantity;
      this.assertQuantity(nextQuantity);
      await this.cartsRepository.updateItemQuantity(existing.id, nextQuantity);
    } else {
      const itemCount = await this.cartsRepository.countItems(cartId);
      if (itemCount >= this.configs.LIMITS.CART.MAX_ITEMS) {
        throw new BusinessRuleException(
          'CART_MAX_ITEMS',
          `Cart cannot contain more than ${this.configs.LIMITS.CART.MAX_ITEMS} distinct products.`,
        );
      }
      await this.cartsRepository.createItem({
        cartId,
        productId: dto.productId,
        quantity: dto.quantity,
      });
    }

    return this.get(cartId);
  }

  async updateItem(
    cartId: number,
    itemId: number,
    dto: UpdateCartItemDto,
  ): Promise<CartResponse> {
    await this.requireCart(cartId);
    this.assertQuantity(dto.quantity);

    const item = await this.cartsRepository.findItem(cartId, itemId);
    if (!item) {
      throw new NotFoundException('CART_ITEM_NOT_FOUND', 'Cart item was not found.');
    }

    const product = await this.productsRepository.findById(item.productId);
    if (!product || !product.isAvailable) {
      throw new BusinessRuleException(
        'PRODUCT_UNAVAILABLE',
        'This product is not available for ordering.',
      );
    }

    await this.cartsRepository.updateItemQuantity(item.id, dto.quantity);
    return this.get(cartId);
  }

  async removeItem(cartId: number, itemId: number): Promise<CartResponse> {
    await this.requireCart(cartId);
    const item = await this.cartsRepository.findItem(cartId, itemId);
    if (!item) {
      throw new NotFoundException('CART_ITEM_NOT_FOUND', 'Cart item was not found.');
    }
    await this.cartsRepository.deleteItem(item.id);
    return this.get(cartId);
  }

  async requireCart(cartId: number) {
    const cart = await this.cartsRepository.findById(cartId);
    if (!cart) {
      throw new NotFoundException('CART_NOT_FOUND', 'Cart was not found.');
    }
    return cart;
  }

  private assertQuantity(quantity: number): void {
    if (
      quantity < this.configs.LIMITS.CART.MIN_QUANTITY ||
      quantity > this.configs.LIMITS.CART.MAX_QUANTITY
    ) {
      throw new BusinessRuleException(
        'INVALID_QUANTITY',
        `Quantity must be between ${this.configs.LIMITS.CART.MIN_QUANTITY} and ${this.configs.LIMITS.CART.MAX_QUANTITY}.`,
      );
    }
  }
}
