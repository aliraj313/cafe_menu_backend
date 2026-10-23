import { Order, OrderItem, OrderStatus } from '../generated/prisma/client';

export type OrderWithItems = Order & { items: OrderItem[] };

export interface OrderItemResponse {
  id: number;
  productId: number;
  productName: string;
  unitPrice: string;
  quantity: number;
  lineTotal: string;
}

export interface OrderResponse {
  id: number;
  cartId: number | null;
  status: OrderStatus;
  totalAmount: string;
  paymentRef: string | null;
  paidAt: Date | null;
  failedAt: Date | null;
  failureReason: string | null;
  items: OrderItemResponse[];
  createdAt: Date;
  updatedAt: Date;
}

export function toOrderResponse(order: OrderWithItems): OrderResponse {
  return {
    id: order.id,
    cartId: order.cartId,
    status: order.status,
    totalAmount: order.totalAmount.toString(),
    paymentRef: order.paymentRef,
    paidAt: order.paidAt,
    failedAt: order.failedAt,
    failureReason: order.failureReason,
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productName: item.productName,
      unitPrice: item.unitPrice.toString(),
      quantity: item.quantity,
      lineTotal: item.lineTotal.toString(),
    })),
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}
