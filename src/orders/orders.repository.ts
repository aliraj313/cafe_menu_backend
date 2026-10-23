import { Injectable } from '@nestjs/common';
import { OrderStatus, Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { OrderWithItems } from './order.mapper';

@Injectable()
export class OrdersRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: {
    userId: number;
    cartId: number;
    totalAmount: bigint;
    items: Array<{
      productId: number;
      productName: string;
      unitPrice: bigint;
      quantity: number;
      lineTotal: bigint;
    }>;
  }): Promise<OrderWithItems> {
    return this.prisma.order.create({
      data: {
        userId: data.userId,
        cartId: data.cartId,
        totalAmount: data.totalAmount,
        status: OrderStatus.PENDING_PAYMENT,
        items: {
          create: data.items,
        },
      },
      include: { items: true },
    });
  }

  findById(id: number): Promise<OrderWithItems | null> {
    return this.prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });
  }

  updateStatus(id: number, data: Prisma.OrderUpdateInput): Promise<OrderWithItems> {
    return this.prisma.order.update({
      where: { id },
      data,
      include: { items: true },
    });
  }
}
