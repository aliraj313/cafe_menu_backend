import { Injectable } from '@nestjs/common';
import {
  MockPaymentOutcome,
  OrderStatus,
  PaymentStatus,
} from '../generated/prisma/client';
import { randomUUID } from 'crypto';
import { ConfigsService } from '../config/configs.service';
import { OrdersRepository } from '../orders/orders.repository';
import { OrdersService } from '../orders/orders.service';
import {
  OrderResponse,
  PaymentResponse,
  toOrderResponse,
  toPaymentResponse,
} from '../orders/order.mapper';
import { PaymentsRepository } from './payments.repository';

export interface MockPaymentResult {
  payment: PaymentResponse;
  order: OrderResponse;
}

@Injectable()
export class PaymentsService {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly ordersRepository: OrdersRepository,
    private readonly paymentsRepository: PaymentsRepository,
    private readonly configs: ConfigsService,
  ) {}

  async mockPay(
    orderId: number,
    userId: number,
    outcome: MockPaymentOutcome,
  ): Promise<MockPaymentResult> {
    const order = await this.ordersService.requirePayableOrder(orderId, userId);
    const paymentRef = `MOCK-${randomUUID()}`;

    if (outcome === MockPaymentOutcome.SUCCESS) {
      const payment = await this.paymentsRepository.create({
        orderId: order.id,
        status: PaymentStatus.SUCCESS,
        amount: order.totalAmount,
        provider: this.configs.PAYMENT_APP.MOCK_PROVIDER,
        paymentRef,
        failureReason: null,
      });

      const updatedOrder = await this.ordersRepository.update(order.id, {
        status: OrderStatus.PAID,
      });

      return {
        payment: toPaymentResponse(payment),
        order: toOrderResponse(updatedOrder),
      };
    }

    const payment = await this.paymentsRepository.create({
      orderId: order.id,
      status: PaymentStatus.FAILED,
      amount: order.totalAmount,
      provider: this.configs.PAYMENT_APP.MOCK_PROVIDER,
      paymentRef,
      failureReason: 'Mock payment failure',
    });

    const updatedOrder = await this.ordersRepository.update(order.id, {
      status: OrderStatus.PAYMENT_FAILED,
    });

    return {
      payment: toPaymentResponse(payment),
      order: toOrderResponse(updatedOrder),
    };
  }
}
