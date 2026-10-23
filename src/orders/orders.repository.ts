import { Injectable } from '@nestjs/common';
import { OrderStatus, Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { OrderWithDetails } from './order.mapper';

@Injectable()
export class OrdersRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: {
    userId: number;
    cartId: number;
    totalAmount: bigint;
    tableNumber?: number | null;
    items: Array<{
      productId: number;
      productName: string;
      unitPrice: bigint;
      quantity: number;
      lineTotal: bigint;
    }>;
  }): Promise<OrderWithDetails> {
    return this.prisma.order.create({
      data: {
        userId: data.userId,
        cartId: data.cartId,
        tableNumber: data.tableNumber ?? null,
        totalAmount: data.totalAmount,
        status: OrderStatus.PENDING_PAYMENT,
        items: {
          create: data.items,
        },
      },
      include: { items: true, payments: { orderBy: { createdAt: 'asc' } } },
    });
  }

  findById(id: number): Promise<OrderWithDetails | null> {
    return this.prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        payments: { orderBy: { createdAt: 'asc' } },
      },
    });
  }

  /**
   * Latest open order for this user+cart that still needs payment.
   */
  findOpenForUserCart(userId: number, cartId: number): Promise<OrderWithDetails | null> {
    return this.prisma.order.findFirst({
      where: {
        userId,
        cartId,
        status: OrderStatus.PENDING_PAYMENT,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        items: true,
        payments: { orderBy: { createdAt: 'asc' } },
      },
    });
  }

  update(id: number, data: Prisma.OrderUpdateInput): Promise<OrderWithDetails> {
    return this.prisma.order.update({
      where: { id },
      data,
      include: {
        items: true,
        payments: { orderBy: { createdAt: 'asc' } },
      },
    });
  }

  findRecent(take: number): Promise<OrderWithDetails[]> {
    return this.prisma.order.findMany({
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        items: true,
        payments: { orderBy: { createdAt: 'asc' } },
      },
    });
  }

  countCreatedBetween(from: Date, to: Date): Promise<number> {
    return this.prisma.order.count({
      where: { createdAt: { gte: from, lt: to } },
    });
  }

  /**
   * Sum of totalAmount for orders that reached PROCESSING (paid) within the range,
   * based on updatedAt as proxy for when payment completed.
   */
  async sumPaidAmountBetween(from: Date, to: Date): Promise<bigint> {
    const result = await this.prisma.order.aggregate({
      where: {
        status: OrderStatus.PROCESSING,
        updatedAt: { gte: from, lt: to },
      },
      _sum: { totalAmount: true },
    });
    return result._sum.totalAmount ?? 0n;
  }
}
