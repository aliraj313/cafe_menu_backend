import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { CategoriesRepository } from '../categories/categories.repository';
import { ConfigsService } from '../config/configs.service';
import { NotFoundException } from '../common/exceptions/app.exception';
import { PaginatedResult } from '../common/types/paginated-result';
import { CreateProductDto } from './dto/create-product.dto';
import { ListProductsQueryDto } from './dto/list-products-query.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductResponse, toProductResponse } from './product.mapper';
import { ProductsRepository } from './products.repository';

@Injectable()
export class ProductsService {
  constructor(
    private readonly productsRepository: ProductsRepository,
    private readonly categoriesRepository: CategoriesRepository,
    private readonly configs: ConfigsService,
  ) {}

  async create(dto: CreateProductDto): Promise<ProductResponse> {
    await this.ensureCategoryExists(dto.categoryId);

    const product = await this.productsRepository.create({
      name: dto.name,
      description: dto.description,
      price: BigInt(dto.price),
      images: dto.images ?? [],
      mealType: dto.mealType,
      isAvailable: dto.isAvailable ?? true,
      category: { connect: { id: dto.categoryId } },
    });

    return toProductResponse(product);
  }

  async findAll(query: ListProductsQueryDto): Promise<PaginatedResult<ProductResponse>> {
    const page = query.page ?? this.configs.LIMITS.PAGINATION.DEFAULT_PAGE;
    const limit = Math.min(
      query.limit ?? this.configs.LIMITS.PAGINATION.DEFAULT_LIMIT,
      this.configs.LIMITS.PAGINATION.MAX_LIMIT,
    );
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.mealType ? { mealType: query.mealType } : {}),
      ...(query.isAvailable !== undefined ? { isAvailable: query.isAvailable } : {}),
    };

    const [items, total] = await Promise.all([
      this.productsRepository.findMany({ skip, take: limit, where }),
      this.productsRepository.count(where),
    ]);

    return {
      items: items.map(toProductResponse),
      meta: {
        page,
        limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number): Promise<ProductResponse> {
    const product = await this.productsRepository.findById(id);
    if (!product) {
      throw new NotFoundException('PRODUCT_NOT_FOUND', 'Product was not found.');
    }
    return toProductResponse(product);
  }

  async update(id: number, dto: UpdateProductDto): Promise<ProductResponse> {
    await this.findOne(id);

    if (dto.categoryId !== undefined) {
      await this.ensureCategoryExists(dto.categoryId);
    }

    const data: Prisma.ProductUpdateInput = {
      ...(dto.name !== undefined ? { name: dto.name } : {}),
      ...(dto.description !== undefined ? { description: dto.description } : {}),
      ...(dto.price !== undefined ? { price: BigInt(dto.price) } : {}),
      ...(dto.images !== undefined ? { images: dto.images } : {}),
      ...(dto.mealType !== undefined ? { mealType: dto.mealType } : {}),
      ...(dto.isAvailable !== undefined ? { isAvailable: dto.isAvailable } : {}),
      ...(dto.categoryId !== undefined
        ? { category: { connect: { id: dto.categoryId } } }
        : {}),
    };

    const product = await this.productsRepository.update(id, data);
    return toProductResponse(product);
  }

  async remove(id: number): Promise<ProductResponse> {
    const product = await this.findOne(id);
    await this.productsRepository.delete(id);
    return product;
  }

  private async ensureCategoryExists(categoryId: number): Promise<void> {
    const category = await this.categoriesRepository.findById(categoryId);
    if (!category) {
      throw new NotFoundException('CATEGORY_NOT_FOUND', 'Category was not found.');
    }
  }
}
