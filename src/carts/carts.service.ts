import { Injectable } from '@nestjs/common';
import {
  BusinessRuleException,
  NotFoundException,
} from '../common/exceptions/app.exception';
import { ConfigsService } from '../config/configs.service';
import { ProductsRepository } from '../products/products.repository';
import { OrderingAvailabilityService } from '../settings/ordering-availability.service';
import { CartResponse, CartWithItems, toCartResponse } from './cart.mapper';
import { CartsRepository } from './carts.repository';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Injectable()
export class CartsService {
  constructor(
    private readonly cartsRepository: CartsRepository,
    private readonly productsRepository: ProductsRepository,
    private readonly configs: ConfigsService,
    private readonly orderingAvailability: OrderingAvailabilityService,
  ) {}

  /**
   * Returns the user's active (non-expired) cart, or null if none.
   */
  async getActive(userId: number): Promise<CartResponse | null> {
    const cart = await this.cartsRepository.findActiveForUser(userId, new Date());
    return cart ? toCartResponse(cart) : null;
  }

  /**
   * Ensures an active cart exists: reuse non-expired cart or create a new one (TTL from config).
   */
  async getOrCreateActiveCart(userId: number): Promise<CartWithItems> {
    const now = new Date();
    const existing = await this.cartsRepository.findActiveForUser(userId, now);
    if (existing) {
      return existing;
    }
    const expiresAt = new Date(
      now.getTime() + this.configs.LIMITS.CART.TTL_HOURS * 60 * 60 * 1000,
    );
    return this.cartsRepository.create(userId, expiresAt);
  }

  async addItem(userId: number, dto: AddCartItemDto): Promise<CartResponse> {
    await this.orderingAvailability.assertOrderingEnabled();
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

    const cart = await this.getOrCreateActiveCart(userId);
    const existing = await this.cartsRepository.findItemByProduct(cart.id, dto.productId);

    if (existing) {
      const nextQuantity = existing.quantity + dto.quantity;
      this.assertQuantity(nextQuantity);
      await this.cartsRepository.updateItemQuantity(existing.id, nextQuantity);
    } else {
      const itemCount = await this.cartsRepository.countItems(cart.id);
      if (itemCount >= this.configs.LIMITS.CART.MAX_ITEMS) {
        throw new BusinessRuleException(
          'CART_MAX_ITEMS',
          `Cart cannot contain more than ${this.configs.LIMITS.CART.MAX_ITEMS} distinct products.`,
        );
      }
      await this.cartsRepository.createItem({
        cartId: cart.id,
        productId: dto.productId,
        quantity: dto.quantity,
      });
    }

    return this.requireActiveCartResponse(userId);
  }

  async updateItem(userId: number, itemId: number, dto: UpdateCartItemDto): Promise<CartResponse> {
    this.assertQuantity(dto.quantity);
    const cart = await this.requireActiveCartEntity(userId);

    const item = await this.cartsRepository.findItem(cart.id, itemId);
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
    return this.requireActiveCartResponse(userId);
  }

  async removeItem(userId: number, itemId: number): Promise<CartResponse> {
    const cart = await this.requireActiveCartEntity(userId);
    const item = await this.cartsRepository.findItem(cart.id, itemId);
    if (!item) {
      throw new NotFoundException('CART_ITEM_NOT_FOUND', 'Cart item was not found.');
    }
    await this.cartsRepository.deleteItem(item.id);
    return this.requireActiveCartResponse(userId);
  }

  async requireActiveCartEntity(userId: number): Promise<CartWithItems> {
    const cart = await this.cartsRepository.findActiveForUser(userId, new Date());
    if (!cart) {
      throw new NotFoundException(
        'CART_NOT_FOUND',
        'No active cart found. Add a product to start a new cart.',
      );
    }
    return cart;
  }

  private async requireActiveCartResponse(userId: number): Promise<CartResponse> {
    const cart = await this.requireActiveCartEntity(userId);
    return toCartResponse(cart);
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
