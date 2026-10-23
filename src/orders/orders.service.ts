import { Injectable } from '@nestjs/common';
import { PaymentStatus, Prisma } from '../generated/prisma/client';
import {
  BusinessRuleException,
  ForbiddenException,
  NotFoundException,
} from '../common/exceptions/app.exception';
import { ConfigsService } from '../config/configs.service';
import { CartsService } from '../carts/carts.service';
import { PaymentsRepository } from '../payments/payments.repository';
import { ZarinpalService } from '../payments/zarinpal/zarinpal.service';
import { PaymentSnapshot } from '../payments/zarinpal/zarinpal.types';
import { OrderingAvailabilityService } from '../settings/ordering-availability.service';
import { SettingsRepository } from '../settings/settings.repository';
import { UsersRepository } from '../auth/users.repository';
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
    private readonly zarinpalService: ZarinpalService,
    private readonly settingsRepository: SettingsRepository,
    private readonly usersRepository: UsersRepository,
    private readonly configs: ConfigsService,
    private readonly orderingAvailability: OrderingAvailabilityService,
  ) {}

  async checkout(userId: number, tableNumber?: number | null): Promise<CheckoutResponse> {
    await this.orderingAvailability.assertOrderingEnabled();
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
        tableNumber: tableNumber ?? null,
        items: orderItems,
      });
    } else if (tableNumber !== undefined) {
      order = await this.ordersRepository.update(order.id, {
        tableNumber: tableNumber,
      });
    }

    const user = await this.usersRepository.findById(userId);
    const merchantId = await this.resolveMerchantId();
    const callbackUrl = this.resolveCallbackUrl();
    const amountNumber = Number(order.totalAmount);
    if (!Number.isSafeInteger(amountNumber) || amountNumber <= 0) {
      throw new BusinessRuleException('INVALID_PAYMENT_AMOUNT', 'Order amount is invalid for payment.');
    }

    const description = `Order #${order.id}`;
    const snapshot: PaymentSnapshot = {
      type: this.configs.PAYMENT_APP.SNAPSHOT_TYPE_ORDER,
      orderId: order.id,
      userId,
      cartId: order.cartId,
      amount: order.totalAmount.toString(),
      currency: this.configs.PAYMENT_APP.CURRENCY_IRT,
      description,
      items: order.items.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        unitPrice: item.unitPrice.toString(),
        quantity: item.quantity,
        lineTotal: item.lineTotal.toString(),
      })),
    };

    const zarinpalResult = await this.zarinpalService.requestPayment({
      merchant_id: merchantId,
      amount: amountNumber,
      callback_url: callbackUrl,
      description,
      currency: this.configs.PAYMENT_APP.CURRENCY_IRT,
      metadata: {
        mobile: user?.mobile,
        order_id: String(order.id),
      },
    });

    const paymentUrl = this.zarinpalService.buildStartPayUrl(zarinpalResult.authority);

    const payment = await this.paymentsRepository.create({
      orderId: order.id,
      status: PaymentStatus.PENDING,
      amount: order.totalAmount,
      provider: this.configs.PAYMENT_APP.PROVIDER_ZARINPAL,
      paymentRef: null,
      paymentUrl,
      authority: zarinpalResult.authority,
      snapshot: snapshot as unknown as Prisma.InputJsonValue,
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

  private async resolveMerchantId(): Promise<string> {
    const settings = await this.settingsRepository.findById(this.configs.SETTINGS.SINGLETON_ID);
    const fromSettings = settings?.zarinpalMerchant?.trim();
    if (fromSettings) {
      return fromSettings;
    }
    const fromEnv = this.configs.PAYMENT.ZARINPAL.MERCHANT_ID;
    if (fromEnv) {
      return fromEnv;
    }
    throw new BusinessRuleException(
      'ZARINPAL_MERCHANT_MISSING',
      'Zarinpal merchant id is not configured.',
    );
  }

  private resolveCallbackUrl(): string {
    const configured = this.configs.PAYMENT.ZARINPAL.CALLBACK_URL;
    if (!configured) {
      throw new BusinessRuleException(
        'ZARINPAL_CALLBACK_MISSING',
        'ZARINPAL_CALLBACK_URL is not configured.',
      );
    }
    return configured;
  }
}
