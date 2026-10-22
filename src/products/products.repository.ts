import { Injectable } from '@nestjs/common';
import { Prisma, Product } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ProductWithCategory } from './product.mapper';

@Injectable()
export class ProductsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.ProductCreateInput): Promise<ProductWithCategory> {
    return this.prisma.product.create({
      data,
      include: { category: true },
    });
  }

  findById(id: number): Promise<ProductWithCategory | null> {
    return this.prisma.product.findUnique({
      where: { id },
      include: { category: true },
    });
  }

  findMany(params: {
    skip: number;
    take: number;
    where: Prisma.ProductWhereInput;
  }): Promise<ProductWithCategory[]> {
    return this.prisma.product.findMany({
      skip: params.skip,
      take: params.take,
      where: params.where,
      orderBy: { createdAt: 'desc' },
      include: { category: true },
    });
  }

  count(where: Prisma.ProductWhereInput): Promise<number> {
    return this.prisma.product.count({ where });
  }

  update(id: number, data: Prisma.ProductUpdateInput): Promise<ProductWithCategory> {
    return this.prisma.product.update({
      where: { id },
      data,
      include: { category: true },
    });
  }

  delete(id: number): Promise<Product> {
    return this.prisma.product.delete({ where: { id } });
  }
}
