import { Injectable } from '@nestjs/common';
import { OrderStatus } from '../generated/prisma/client';
import {
  BusinessRuleException,
  ForbiddenException,
  NotFoundException,
} from '../common/exceptions/app.exception';
import { CartsRepository } from '../carts/carts.repository';
import { CartsService } from '../carts/carts.service';
import { OrderResponse, toOrderResponse } from './order.mapper';
import { OrdersRepository } from './orders.repository';

@Injectable()
export class OrdersService {
  constructor(
    private readonly ordersRepository: OrdersRepository,
    private readonly cartsService: CartsService,
    private readonly cartsRepository: CartsRepository,
  ) {}

  async checkout(cartId: number, userId: number): Promise<OrderResponse> {
    const cart = await this.cartsService.requireOwnedCart(cartId, userId);

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

    const order = await this.ordersRepository.create({
      userId,
      cartId,
      totalAmount,
      items: orderItems,
    });

    await this.cartsRepository.clearItems(cartId);

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

  async requirePendingOrder(orderId: number, userId: number) {
    const order = await this.ordersRepository.findById(orderId);
    if (!order) {
      throw new NotFoundException('ORDER_NOT_FOUND', 'Order was not found.');
    }
    if (order.userId !== userId) {
      throw new ForbiddenException('ORDER_FORBIDDEN', 'You do not own this order.');
    }
    if (order.status !== OrderStatus.PENDING_PAYMENT) {
      throw new BusinessRuleException(
        'ORDER_NOT_PAYABLE',
        `Order is not awaiting payment (current status: ${order.status}).`,
      );
    }
    return order;
  }
}
