-- CreateEnum
CREATE TYPE "PaymentGatewayProvider" AS ENUM ('ZARINPAL');

-- CreateTable
CREATE TABLE "settings" (
    "id" TEXT NOT NULL,
    "cafeName" TEXT NOT NULL,
    "slogan" TEXT,
    "logoUrl" TEXT,
    "description" TEXT,
    "phone" TEXT,
    "workingHours" TEXT,
    "address" TEXT,
    "instagramUrl" TEXT,
    "telegramUrl" TEXT,
    "ordersAndPaymentsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "paymentProvider" "PaymentGatewayProvider",
    "paymentGatewayConfig" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);
