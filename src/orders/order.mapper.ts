import { Order, OrderItem, OrderStatus, Payment, PaymentStatus, Prisma } from '../generated/prisma/client';

export type OrderWithDetails = Order & {
  items: OrderItem[];
  payments: Payment[];
};

export interface OrderItemResponse {
  id: number;
  productId: number;
  productName: string;
  unitPrice: string;
  quantity: number;
  lineTotal: string;
}

export interface PaymentResponse {
  id: number;
  orderId: number;
  status: PaymentStatus;
  amount: string;
  provider: string;
  paymentRef: string | null;
  paymentUrl: string | null;
  authority: string | null;
  failureReason: string | null;
  verifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderResponse {
  id: number;
  userId: number;
  cartId: number | null;
  status: OrderStatus;
  totalAmount: string;
  items: OrderItemResponse[];
  payments: PaymentResponse[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CheckoutResponse {
  order: OrderResponse;
  payment: PaymentResponse;
}

export interface PaymentStatusResponse {
  id: number;
  status: PaymentStatus;
  amount: string | null;
  paymentRef: string | null;
  verifiedAt: Date | null;
  failureReason: string | null;
}

export function toPaymentResponse(payment: Payment): PaymentResponse {
  return {
    id: payment.id,
    orderId: payment.orderId,
    status: payment.status,
    amount: payment.amount.toString(),
    provider: payment.provider,
    paymentRef: payment.paymentRef,
    paymentUrl: payment.paymentUrl,
    authority: payment.authority,
    failureReason: payment.failureReason,
    verifiedAt: payment.verifiedAt,
    createdAt: payment.createdAt,
    updatedAt: payment.updatedAt,
  };
}

export function toOrderResponse(order: OrderWithDetails): OrderResponse {
  return {
    id: order.id,
    userId: order.userId,
    cartId: order.cartId,
    status: order.status,
    totalAmount: order.totalAmount.toString(),
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productName: item.productName,
      unitPrice: item.unitPrice.toString(),
      quantity: item.quantity,
      lineTotal: item.lineTotal.toString(),
    })),
    payments: (order.payments ?? []).map(toPaymentResponse),
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

export function toPaymentStatusResponse(payment: Payment): PaymentStatusResponse {
  if (payment.status === PaymentStatus.FAILED) {
    return {
      id: payment.id,
      status: payment.status,
      amount: null,
      paymentRef: null,
      verifiedAt: null,
      failureReason: payment.failureReason,
    };
  }
  return {
    id: payment.id,
    status: payment.status,
    amount: payment.amount.toString(),
    paymentRef: payment.paymentRef,
    verifiedAt: payment.verifiedAt,
    failureReason: payment.failureReason,
  };
}

export type SnapshotJson = Prisma.InputJsonValue;
