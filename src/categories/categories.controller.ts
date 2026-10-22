import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { UserRole } from '../generated/prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Category } from '../generated/prisma/client';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { PaginatedResult } from '../common/types/paginated-result';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@ApiTags('categories')
@Roles(UserRole.ADMIN)
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a category' })
  create(@Body() dto: CreateCategoryDto): Promise<Category> {
    return this.categoriesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List categories' })
  findAll(@Query() query: PaginationQueryDto): Promise<PaginatedResult<Category>> {
    return this.categoriesService.findAll(query.page, query.limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a category by id' })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Category> {
    return this.categoriesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a category' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCategoryDto,
  ): Promise<Category> {
    return this.categoriesService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a category' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.categoriesService.remove(id);
  }
}
