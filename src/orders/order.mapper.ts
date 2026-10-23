import { Order, OrderItem, OrderStatus, Payment, PaymentStatus } from '../generated/prisma/client';

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
  failureReason: string | null;
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

export function toPaymentResponse(payment: Payment): PaymentResponse {
  return {
    id: payment.id,
    orderId: payment.orderId,
    status: payment.status,
    amount: payment.amount.toString(),
    provider: payment.provider,
    paymentRef: payment.paymentRef,
    paymentUrl: payment.paymentUrl,
    failureReason: payment.failureReason,
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
