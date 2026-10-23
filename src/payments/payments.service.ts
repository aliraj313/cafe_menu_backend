import { Injectable } from '@nestjs/common';
import { MockPaymentOutcome, OrderStatus } from '../generated/prisma/client';
import { randomUUID } from 'crypto';
import { OrdersRepository } from '../orders/orders.repository';
import { OrdersService } from '../orders/orders.service';
import { OrderResponse, toOrderResponse } from '../orders/order.mapper';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly ordersRepository: OrdersRepository,
  ) {}

  async mockPay(
    orderId: number,
    userId: number,
    outcome: MockPaymentOutcome,
  ): Promise<OrderResponse> {
    await this.ordersService.requirePendingOrder(orderId, userId);

    const paymentRef = `MOCK-${randomUUID()}`;
    const now = new Date();

    if (outcome === MockPaymentOutcome.SUCCESS) {
      const order = await this.ordersRepository.updateStatus(orderId, {
        status: OrderStatus.PAID,
        paymentRef,
        paidAt: now,
        failedAt: null,
        failureReason: null,
      });
      return toOrderResponse(order);
    }

    const order = await this.ordersRepository.updateStatus(orderId, {
      status: OrderStatus.PAYMENT_FAILED,
      paymentRef,
      failedAt: now,
      failureReason: 'Mock payment failure',
    });
    return toOrderResponse(order);
  }
}
