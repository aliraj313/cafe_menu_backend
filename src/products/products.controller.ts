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
import { PaginatedResult } from '../common/types/paginated-result';
import { CreateProductDto } from './dto/create-product.dto';
import { ListProductsQueryDto } from './dto/list-products-query.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductResponse } from './product.mapper';
import { ProductsService } from './products.service';

@ApiTags('products')
@Roles(UserRole.ADMIN)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a product (food or drink)' })
  create(@Body() dto: CreateProductDto): Promise<ProductResponse> {
    return this.productsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List products with optional filters' })
  findAll(@Query() query: ListProductsQueryDto): Promise<PaginatedResult<ProductResponse>> {
    return this.productsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a product by id' })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<ProductResponse> {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a product' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductDto,
  ): Promise<ProductResponse> {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a product' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.productsService.remove(id);
  }
}
