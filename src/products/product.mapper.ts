import { Category, Product } from '@prisma/client';

export type ProductWithCategory = Product & { category?: Category };

export interface ProductResponse {
  id: number;
  name: string;
  description: string | null;
  price: string;
  images: string[];
  mealType: string;
  isAvailable: boolean;
  categoryId: number;
  category?: { id: number; name: string };
  createdAt: Date;
  updatedAt: Date;
}

export function toProductResponse(product: ProductWithCategory): ProductResponse {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price.toString(),
    images: product.images,
    mealType: product.mealType,
    isAvailable: product.isAvailable,
    categoryId: product.categoryId,
    ...(product.category
      ? { category: { id: product.category.id, name: product.category.name } }
      : {}),
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}
