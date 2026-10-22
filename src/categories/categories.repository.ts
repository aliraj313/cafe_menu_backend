import { Injectable } from '@nestjs/common';
import { Category, Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.CategoryCreateInput): Promise<Category> {
    return this.prisma.category.create({ data });
  }

  findById(id: number): Promise<Category | null> {
    return this.prisma.category.findUnique({ where: { id } });
  }

  findByName(name: string): Promise<Category | null> {
    return this.prisma.category.findUnique({ where: { name } });
  }

  findMany(params: {
    skip: number;
    take: number;
  }): Promise<Category[]> {
    return this.prisma.category.findMany({
      skip: params.skip,
      take: params.take,
      orderBy: { createdAt: 'desc' },
    });
  }

  count(): Promise<number> {
    return this.prisma.category.count();
  }

  update(id: number, data: Prisma.CategoryUpdateInput): Promise<Category> {
    return this.prisma.category.update({ where: { id }, data });
  }

  delete(id: number): Promise<Category> {
    return this.prisma.category.delete({ where: { id } });
  }

  countProducts(categoryId: number): Promise<number> {
    return this.prisma.product.count({ where: { categoryId } });
  }
}
