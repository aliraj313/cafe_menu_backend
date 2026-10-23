import { Injectable } from '@nestjs/common';
import { OrderStatus, PaymentStatus } from '../generated/prisma/client';
import {
  BusinessRuleException,
  ForbiddenException,
  NotFoundException,
} from '../common/exceptions/app.exception';
import { ConfigsService } from '../config/configs.service';
import { CartsService } from '../carts/carts.service';
import { PaymentsRepository } from '../payments/payments.repository';
import {
  CheckoutResponse,
  OrderResponse,
  toOrderResponse,
  toPaymentResponse,
} from './order.mapper';
import { OrdersRepository } from './orders.repository';

@Injectable()
export class OrdersService {
  constructor(
    private readonly ordersRepository: OrdersRepository,
    private readonly cartsService: CartsService,
    private readonly paymentsRepository: PaymentsRepository,
    private readonly configs: ConfigsService,
  ) {}

  /**
   * Ensures an open order exists for the active cart and always creates a new PENDING payment.
   * paymentUrl is reserved for the real gateway integration in a later step.
   */
  async checkout(userId: number): Promise<CheckoutResponse> {
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

    let order = await this.ordersRepository.findOpenForUserCart(userId, cart.id);

    if (!order) {
      order = await this.ordersRepository.create({
        userId,
        cartId: cart.id,
        totalAmount,
        items: orderItems,
      });
    } else {
      // Re-open for a new payment attempt after a previous failure.
      if (order.status === OrderStatus.PAYMENT_FAILED) {
        order = await this.ordersRepository.update(order.id, {
          status: OrderStatus.PENDING_PAYMENT,
        });
      }
    }

    const payment = await this.paymentsRepository.create({
      orderId: order.id,
      status: PaymentStatus.PENDING,
      amount: order.totalAmount,
      provider: this.configs.PAYMENT_APP.MOCK_PROVIDER,
      paymentRef: null,
      paymentUrl: null,
      failureReason: null,
    });

    const refreshed = await this.ordersRepository.findById(order.id);
    if (!refreshed) {
      throw new NotFoundException('ORDER_NOT_FOUND', 'Order was not found after checkout.');
    }

    return {
      order: toOrderResponse(refreshed),
      payment: toPaymentResponse(payment),
    };
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

  async requireOwnedOrder(orderId: number, userId: number) {
    const order = await this.ordersRepository.findById(orderId);
    if (!order) {
      throw new NotFoundException('ORDER_NOT_FOUND', 'Order was not found.');
    }
    if (order.userId !== userId) {
      throw new ForbiddenException('ORDER_FORBIDDEN', 'You do not own this order.');
    }
    return order;
  }
}
