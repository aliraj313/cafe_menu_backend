import { Injectable, Logger } from '@nestjs/common';
import { OrderStatus, PaymentStatus, Prisma } from '../generated/prisma/client';
import {
  BusinessRuleException,
  ForbiddenException,
  NotFoundException,
} from '../common/exceptions/app.exception';
import { ConfigsService } from '../config/configs.service';
import { CartsRepository } from '../carts/carts.repository';
import { OrdersRepository } from '../orders/orders.repository';
import {
  PaymentStatusResponse,
  toOrderResponse,
  toPaymentStatusResponse,
} from '../orders/order.mapper';
import { AdminOrdersGateway } from '../realtime/admin-orders.gateway';
import { SettingsRepository } from '../settings/settings.repository';
import { PaymentsRepository } from './payments.repository';
import { ZarinpalService } from './zarinpal/zarinpal.service';
import { PaymentSnapshot } from './zarinpal/zarinpal.types';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly paymentsRepository: PaymentsRepository,
    private readonly ordersRepository: OrdersRepository,
    private readonly cartsRepository: CartsRepository,
    private readonly zarinpalService: ZarinpalService,
    private readonly settingsRepository: SettingsRepository,
    private readonly adminOrdersGateway: AdminOrdersGateway,
    private readonly configs: ConfigsService,
  ) {}

  /**
   * Zarinpal browser callback (server-to-server verify happens here).
   * Returns absolute frontend redirect URL.
   */
  async handleZarinpalCallback(authority: string, status: string): Promise<string> {
    const normalizedAuthority = authority?.trim();
    const normalizedStatus = status?.trim().toUpperCase();

    if (!normalizedAuthority) {
      return this.buildFrontendRedirect(null, false);
    }

    const payment = await this.paymentsRepository.findByAuthority(normalizedAuthority);
    if (!payment) {
      this.logger.warn({ authority: normalizedAuthority }, 'Callback for unknown authority');
      return this.buildFrontendRedirect(null, false);
    }

    // Idempotent: already finalized
    if (payment.status === PaymentStatus.SUCCESS) {
      return this.buildFrontendRedirect(payment.id, true);
    }
    if (payment.status === PaymentStatus.FAILED && payment.verifiedAt) {
      return this.buildFrontendRedirect(payment.id, false);
    }

    if (normalizedStatus !== 'OK') {
      await this.markPaymentFailed(payment.id, payment.orderId, 'Payment cancelled or failed at gateway');
      return this.buildFrontendRedirect(payment.id, false);
    }

    const snapshot = this.parseSnapshot(payment.snapshot);
    if (!snapshot) {
      await this.markPaymentFailed(payment.id, payment.orderId, 'Invalid payment snapshot');
      return this.buildFrontendRedirect(payment.id, false);
    }

    // Security: amount in DB must match snapshot
    if (snapshot.amount !== payment.amount.toString() || snapshot.orderId !== payment.orderId) {
      await this.markPaymentFailed(payment.id, payment.orderId, 'Payment snapshot mismatch');
      return this.buildFrontendRedirect(payment.id, false);
    }

    const amountNumber = Number(payment.amount);
    if (!Number.isSafeInteger(amountNumber) || amountNumber <= 0) {
      await this.markPaymentFailed(payment.id, payment.orderId, 'Invalid payment amount');
      return this.buildFrontendRedirect(payment.id, false);
    }

    const merchantId = await this.resolveMerchantId();
    let verifyResult;
    try {
      verifyResult = await this.zarinpalService.verifyPayment({
        merchant_id: merchantId,
        amount: amountNumber,
        authority: normalizedAuthority,
      });
    } catch (err) {
      this.logger.error({ err, paymentId: payment.id }, 'Zarinpal verify request failed');
      await this.markPaymentFailed(payment.id, payment.orderId, 'Zarinpal verify request failed');
      return this.buildFrontendRedirect(payment.id, false);
    }

    if (!this.zarinpalService.isSuccessCode(verifyResult.code)) {
      await this.markPaymentFailed(
        payment.id,
        payment.orderId,
        verifyResult.message || `Zarinpal verify failed (code ${verifyResult.code})`,
      );
      return this.buildFrontendRedirect(payment.id, false);
    }

    // Success path — process based on snapshot type
    if (snapshot.type !== this.configs.PAYMENT_APP.SNAPSHOT_TYPE_ORDER) {
      await this.markPaymentFailed(payment.id, payment.orderId, `Unsupported snapshot type: ${snapshot.type}`);
      return this.buildFrontendRedirect(payment.id, false);
    }

    const now = new Date();
    await this.paymentsRepository.update(payment.id, {
      status: PaymentStatus.SUCCESS,
      paymentRef: verifyResult.refId,
      verifiedAt: now,
      failureReason: null,
    });

    const updatedOrder = await this.ordersRepository.update(payment.orderId, {
      status: OrderStatus.PROCESSING,
    });

    if (snapshot.cartId !== null) {
      await this.cartsRepository.clearItems(snapshot.cartId);
      await this.cartsRepository.expireCart(snapshot.cartId, now);
    }

    this.adminOrdersGateway.emitOrderPaid(toOrderResponse(updatedOrder));

    return this.buildFrontendRedirect(payment.id, true);
  }

  async getStatusForUser(paymentId: number, userId: number): Promise<PaymentStatusResponse> {
    const payment = await this.paymentsRepository.findById(paymentId);
    if (!payment) {
      throw new NotFoundException('PAYMENT_NOT_FOUND', 'Payment was not found.');
    }

    const order = await this.ordersRepository.findById(payment.orderId);
    if (!order || order.userId !== userId) {
      throw new ForbiddenException('PAYMENT_FORBIDDEN', 'You do not own this payment.');
    }

    return toPaymentStatusResponse(payment);
  }

  private async markPaymentFailed(
    paymentId: number,
    orderId: number,
    reason: string,
  ): Promise<void> {
    await this.paymentsRepository.update(paymentId, {
      status: PaymentStatus.FAILED,
      failureReason: reason,
      verifiedAt: new Date(),
    });
    await this.ordersRepository.update(orderId, {
      status: OrderStatus.PENDING_PAYMENT,
    });
  }

  private parseSnapshot(value: Prisma.JsonValue | null): PaymentSnapshot | null {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
      return null;
    }
    const obj = value as Record<string, unknown>;
    if (typeof obj.type !== 'string' || typeof obj.orderId !== 'number') {
      return null;
    }
    if (typeof obj.userId !== 'number' || typeof obj.amount !== 'string') {
      return null;
    }
    return obj as unknown as PaymentSnapshot;
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

  private buildFrontendRedirect(paymentId: number | null, success: boolean): string {
    const path = success
      ? this.configs.PAYMENT_APP.FRONTEND_SUCCESS_PATH
      : this.configs.PAYMENT_APP.FRONTEND_FAILURE_PATH;
    const base = this.configs.FRONTEND_ORIGIN.replace(/\/$/, '');
    const url = new URL(`${base}${path}`);
    if (paymentId !== null) {
      url.searchParams.set('paymentId', String(paymentId));
    }
    return url.toString();
  }
}
