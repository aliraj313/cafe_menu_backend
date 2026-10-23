import { Injectable } from '@nestjs/common';
import {
  MockPaymentOutcome,
  OrderStatus,
  PaymentStatus,
} from '../generated/prisma/client';
import { randomUUID } from 'crypto';
import {
  BusinessRuleException,
  ForbiddenException,
  NotFoundException,
} from '../common/exceptions/app.exception';
import { CartsRepository } from '../carts/carts.repository';
import { OrdersRepository } from '../orders/orders.repository';
import {
  CheckoutResponse,
  toOrderResponse,
  toPaymentResponse,
} from '../orders/order.mapper';
import { AdminOrdersGateway } from '../realtime/admin-orders.gateway';
import { PaymentsRepository } from './payments.repository';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly paymentsRepository: PaymentsRepository,
    private readonly ordersRepository: OrdersRepository,
    private readonly cartsRepository: CartsRepository,
    private readonly adminOrdersGateway: AdminOrdersGateway,
  ) {}

  async mockPay(
    paymentId: number,
    userId: number,
    outcome: MockPaymentOutcome,
  ): Promise<CheckoutResponse> {
    const payment = await this.paymentsRepository.findById(paymentId);
    if (!payment) {
      throw new NotFoundException('PAYMENT_NOT_FOUND', 'Payment was not found.');
    }

    const order = await this.ordersRepository.findById(payment.orderId);
    if (!order) {
      throw new NotFoundException('ORDER_NOT_FOUND', 'Order was not found.');
    }
    if (order.userId !== userId) {
      throw new ForbiddenException('PAYMENT_FORBIDDEN', 'You do not own this payment.');
    }

    if (payment.status !== PaymentStatus.PENDING) {
      throw new BusinessRuleException(
        'PAYMENT_ALREADY_FINALIZED',
        `Payment is already finalized (status: ${payment.status}).`,
      );
    }

    if (
      order.status === OrderStatus.PROCESSING ||
      order.status === OrderStatus.CANCELLED
    ) {
      throw new BusinessRuleException(
        'ORDER_NOT_PAYABLE',
        `Order cannot accept payment (status: ${order.status}).`,
      );
    }

    const paymentRef = `MOCK-${randomUUID()}`;

    if (outcome === MockPaymentOutcome.SUCCESS) {
      const updatedPayment = await this.paymentsRepository.update(payment.id, {
        status: PaymentStatus.SUCCESS,
        paymentRef,
        failureReason: null,
      });

      const updatedOrder = await this.ordersRepository.update(order.id, {
        status: OrderStatus.PROCESSING,
      });

      if (order.cartId !== null) {
        await this.cartsRepository.clearItems(order.cartId);
        await this.cartsRepository.expireCart(order.cartId, new Date());
      }

      const orderPayload = toOrderResponse(updatedOrder);
      this.adminOrdersGateway.emitOrderPaid(orderPayload);

      return {
        payment: toPaymentResponse(updatedPayment),
        order: orderPayload,
      };
    }

    const updatedPayment = await this.paymentsRepository.update(payment.id, {
      status: PaymentStatus.FAILED,
      paymentRef,
      failureReason: 'Mock payment failure',
    });

    const updatedOrder = await this.ordersRepository.update(order.id, {
      status: OrderStatus.PENDING_PAYMENT,
    });

    return {
      payment: toPaymentResponse(updatedPayment),
      order: toOrderResponse(updatedOrder),
    };
  }
}
