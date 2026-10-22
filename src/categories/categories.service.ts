import { Injectable } from '@nestjs/common';
import { Category } from '@prisma/client';
import { ConfigsService } from '../config/configs.service';
import { ConflictException, NotFoundException } from '../common/exceptions/app.exception';
import { PaginatedResult } from '../common/types/paginated-result';
import { CategoriesRepository } from './categories.repository';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    private readonly categoriesRepository: CategoriesRepository,
    private readonly configs: ConfigsService,
  ) {}

  async create(dto: CreateCategoryDto): Promise<Category> {
    const existing = await this.categoriesRepository.findByName(dto.name);
    if (existing) {
      throw new ConflictException(
        'CATEGORY_NAME_EXISTS',
        'A category with this name already exists.',
      );
    }
    return this.categoriesRepository.create({ name: dto.name });
  }

  async findAll(page?: number, limit?: number): Promise<PaginatedResult<Category>> {
    const resolvedPage = page ?? this.configs.LIMITS.PAGINATION.DEFAULT_PAGE;
    const resolvedLimit = Math.min(
      limit ?? this.configs.LIMITS.PAGINATION.DEFAULT_LIMIT,
      this.configs.LIMITS.PAGINATION.MAX_LIMIT,
    );
    const skip = (resolvedPage - 1) * resolvedLimit;

    const [items, total] = await Promise.all([
      this.categoriesRepository.findMany({ skip, take: resolvedLimit }),
      this.categoriesRepository.count(),
    ]);

    return {
      items,
      meta: {
        page: resolvedPage,
        limit: resolvedLimit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / resolvedLimit),
      },
    };
  }

  async findOne(id: number): Promise<Category> {
    const category = await this.categoriesRepository.findById(id);
    if (!category) {
      throw new NotFoundException('CATEGORY_NOT_FOUND', 'Category was not found.');
    }
    return category;
  }

  async update(id: number, dto: UpdateCategoryDto): Promise<Category> {
    await this.findOne(id);

    if (dto.name !== undefined) {
      const existing = await this.categoriesRepository.findByName(dto.name);
      if (existing && existing.id !== id) {
        throw new ConflictException(
          'CATEGORY_NAME_EXISTS',
          'A category with this name already exists.',
        );
      }
    }

    return this.categoriesRepository.update(id, {
      ...(dto.name !== undefined ? { name: dto.name } : {}),
    });
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);
    const productCount = await this.categoriesRepository.countProducts(id);
    if (productCount > 0) {
      throw new ConflictException(
        'CATEGORY_HAS_PRODUCTS',
        'Cannot delete a category that still has products.',
      );
    }
    await this.categoriesRepository.delete(id);
  }
}
