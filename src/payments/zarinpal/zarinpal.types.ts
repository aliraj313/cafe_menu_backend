export interface ZarinpalRequestPayload {
  merchant_id: string;
  amount: number;
  callback_url: string;
  description: string;
  currency?: string;
  metadata?: {
    mobile?: string;
    email?: string;
    order_id?: string;
  };
}

export interface ZarinpalRequestResult {
  authority: string;
  fee: number;
  feeType: string;
}

export interface ZarinpalVerifyPayload {
  merchant_id: string;
  amount: number;
  authority: string;
}

export interface ZarinpalVerifyResult {
  code: number;
  message: string;
  refId: string | null;
  cardPan: string | null;
  cardHash: string | null;
  fee: number | null;
  feeType: string | null;
}

export interface PaymentSnapshot {
  type: string;
  orderId: number;
  userId: number;
  cartId: number | null;
  amount: string;
  currency: string;
  description: string;
  items: Array<{
    productId: number;
    productName: string;
    unitPrice: string;
    quantity: number;
    lineTotal: string;
  }>;
}
