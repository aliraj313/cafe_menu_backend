import { PaymentGatewayProvider, Prisma, Settings } from '../generated/prisma/client';

export interface SettingsResponse {
  id: number;
  cafeName: string;
  slogan: string | null;
  logoUrl: string | null;
  description: string | null;
  phone: string | null;
  workingHours: string | null;
  address: string | null;
  instagramUrl: string | null;
  telegramUrl: string | null;
  ordersAndPaymentsEnabled: boolean;
  paymentProvider: PaymentGatewayProvider | null;
  paymentGatewayConfig: Record<string, unknown> | null;
  theme: Prisma.JsonValue | null;
  createdAt: Date;
  updatedAt: Date;
}

export function toSettingsResponse(settings: Settings): SettingsResponse {
  return {
    id: settings.id,
    cafeName: settings.cafeName,
    slogan: settings.slogan,
    logoUrl: settings.logoUrl,
    description: settings.description,
    phone: settings.phone,
    workingHours: settings.workingHours,
    address: settings.address,
    instagramUrl: settings.instagramUrl,
    telegramUrl: settings.telegramUrl,
    ordersAndPaymentsEnabled: settings.ordersAndPaymentsEnabled,
    paymentProvider: settings.paymentProvider,
    paymentGatewayConfig: toPlainConfig(settings.paymentGatewayConfig),
    theme: settings.theme ?? null,
    createdAt: settings.createdAt,
    updatedAt: settings.updatedAt,
  };
}

function toPlainConfig(value: Prisma.JsonValue | null): Record<string, unknown> | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}
