import { Injectable } from '@nestjs/common';
import { Category, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.CategoryCreateInput): Promise<Category> {
    return this.prisma.category.create({ data });
  }

  findById(id: string): Promise<Category | null> {
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

  update(id: string, data: Prisma.CategoryUpdateInput): Promise<Category> {
    return this.prisma.category.update({ where: { id }, data });
  }

  delete(id: string): Promise<Category> {
    return this.prisma.category.delete({ where: { id } });
  }

  countProducts(categoryId: string): Promise<number> {
    return this.prisma.product.count({ where: { categoryId } });
  }
}
