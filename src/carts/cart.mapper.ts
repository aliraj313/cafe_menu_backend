import { Cart, CartItem, Product } from '../generated/prisma/client';

export type CartItemWithProduct = CartItem & { product: Product };
export type CartWithItems = Cart & { items: CartItemWithProduct[] };

export interface CartItemResponse {
  id: number;
  productId: number;
  quantity: number;
  product: {
    id: number;
    name: string;
    price: string;
    images: string[];
    isAvailable: boolean;
  };
  lineTotal: string;
}

export interface CartResponse {
  id: number;
  expiresAt: Date;
  items: CartItemResponse[];
  totalAmount: string;
  itemsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export function toCartResponse(cart: CartWithItems): CartResponse {
  let total = 0n;
  const items: CartItemResponse[] = cart.items.map((item) => {
    const lineTotal = item.product.price * BigInt(item.quantity);
    total += lineTotal;
    return {
      id: item.id,
      productId: item.productId,
      quantity: item.quantity,
      product: {
        id: item.product.id,
        name: item.product.name,
        price: item.product.price.toString(),
        images: item.product.images,
        isAvailable: item.product.isAvailable,
      },
      lineTotal: lineTotal.toString(),
    };
  });

  return {
    id: cart.id,
    expiresAt: cart.expiresAt,
    items,
    totalAmount: total.toString(),
    itemsCount: items.reduce((sum, i) => sum + i.quantity, 0),
    createdAt: cart.createdAt,
    updatedAt: cart.updatedAt,
  };
}
