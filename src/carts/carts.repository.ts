import { Injectable } from '@nestjs/common';
import { CartItem, Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CartWithItems } from './cart.mapper';

@Injectable()
export class CartsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(userId: number, expiresAt: Date): Promise<CartWithItems> {
    return this.prisma.cart.create({
      data: { userId, expiresAt },
      include: { items: { include: { product: true } } },
    });
  }

  findActiveForUser(userId: number, now: Date): Promise<CartWithItems | null> {
    return this.prisma.cart.findFirst({
      where: {
        userId,
        expiresAt: { gt: now },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: { product: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  findById(id: number): Promise<CartWithItems | null> {
    return this.prisma.cart.findUnique({
      where: { id },
      include: {
        items: {
          include: { product: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  findItem(cartId: number, itemId: number): Promise<CartItem | null> {
    return this.prisma.cartItem.findFirst({
      where: { id: itemId, cartId },
    });
  }

  findItemByProduct(cartId: number, productId: number): Promise<CartItem | null> {
    return this.prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId, productId } },
    });
  }

  createItem(data: Prisma.CartItemUncheckedCreateInput): Promise<CartItem> {
    return this.prisma.cartItem.create({ data });
  }

  updateItemQuantity(id: number, quantity: number): Promise<CartItem> {
    return this.prisma.cartItem.update({
      where: { id },
      data: { quantity },
    });
  }

  deleteItem(id: number): Promise<CartItem> {
    return this.prisma.cartItem.delete({ where: { id } });
  }

  countItems(cartId: number): Promise<number> {
    return this.prisma.cartItem.count({ where: { cartId } });
  }

  clearItems(cartId: number): Promise<Prisma.BatchPayload> {
    return this.prisma.cartItem.deleteMany({ where: { cartId } });
  }
}
