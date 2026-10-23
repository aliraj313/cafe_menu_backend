import { Injectable } from '@nestjs/common';
import { OrderStatus } from '../generated/prisma/client';
import {
  BusinessRuleException,
  ForbiddenException,
  NotFoundException,
} from '../common/exceptions/app.exception';
import { CartsService } from '../carts/carts.service';
import { OrderResponse, toOrderResponse } from './order.mapper';
import { OrdersRepository } from './orders.repository';

@Injectable()
export class OrdersService {
  constructor(
    private readonly ordersRepository: OrdersRepository,
    private readonly cartsService: CartsService,
  ) {}

  async checkout(userId: number): Promise<OrderResponse> {
    const cart = await this.cartsService.requireActiveCartEntity(userId);

    if (cart.items.length === 0) {
      throw new BusinessRuleException('CART_EMPTY', 'Cannot checkout an empty cart.');
    }

    for (const item of cart.items) {
      if (!item.product.isAvailable) {
        throw new BusinessRuleException(
          'PRODUCT_UNAVAILABLE',
          `Product "${item.product.name}" is not available.`,
        );
      }
    }

    let totalAmount = 0n;
    const orderItems = cart.items.map((item) => {
      const lineTotal = item.product.price * BigInt(item.quantity);
      totalAmount += lineTotal;
      return {
        productId: item.productId,
        productName: item.product.name,
        unitPrice: item.product.price,
        quantity: item.quantity,
        lineTotal,
      };
    });

    // Cart is intentionally kept so the customer can retry payment on the order.
    const order = await this.ordersRepository.create({
      userId,
      cartId: cart.id,
      totalAmount,
      items: orderItems,
    });

    return toOrderResponse(order);
  }

  async get(orderId: number, userId: number): Promise<OrderResponse> {
    const order = await this.ordersRepository.findById(orderId);
    if (!order) {
      throw new NotFoundException('ORDER_NOT_FOUND', 'Order was not found.');
    }
    if (order.userId !== userId) {
      throw new ForbiddenException('ORDER_FORBIDDEN', 'You do not own this order.');
    }
    return toOrderResponse(order);
  }

  /**
   * Order remains payable while not PAID / CANCELLED (allows multiple payment attempts).
   */
  async requirePayableOrder(orderId: number, userId: number) {
    const order = await this.ordersRepository.findById(orderId);
    if (!order) {
      throw new NotFoundException('ORDER_NOT_FOUND', 'Order was not found.');
    }
    if (order.userId !== userId) {
      throw new ForbiddenException('ORDER_FORBIDDEN', 'You do not own this order.');
    }
    if (order.status === OrderStatus.PAID) {
      throw new BusinessRuleException('ORDER_ALREADY_PAID', 'Order is already paid.');
    }
    if (order.status === OrderStatus.CANCELLED) {
      throw new BusinessRuleException('ORDER_CANCELLED', 'Order is cancelled and cannot be paid.');
    }
    return order;
  }
}
