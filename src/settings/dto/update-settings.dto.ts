import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentGatewayProvider } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class UpdateSettingsDto {
  @ApiPropertyOptional({ example: 'کافه‌ی نور' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  cafeName?: string;

  @ApiPropertyOptional({ example: 'طعم واقعی قهوه' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  slogan?: string | null;

  @ApiPropertyOptional({ nullable: true, example: 'https://cdn.example.com/logo.png' })
  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsUrl({ require_tld: false })
  logoUrl?: string | null;

  @ApiPropertyOptional({ example: 'کافه تخصصی قهوه و دسر' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string | null;

  @ApiPropertyOptional({ example: '02112345678' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string | null;

  @ApiPropertyOptional({ example: 'همه‌روزه ۸ صبح تا ۱۱ شب' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  workingHours?: string | null;

  @ApiPropertyOptional({ example: 'تهران، خیابان ولیعصر' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  address?: string | null;

  @ApiPropertyOptional({ example: 'https://instagram.com/mycafé' })
  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsUrl({ require_tld: false })
  instagramUrl?: string | null;

  @ApiPropertyOptional({ example: 'https://t.me/mycafé' })
  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsUrl({ require_tld: false })
  telegramUrl?: string | null;

  @ApiPropertyOptional({
    description: 'Enable online ordering and payment. When true, paymentProvider and gateway config are required.',
  })
  @IsOptional()
  @IsBoolean()
  ordersAndPaymentsEnabled?: boolean;

  @ApiPropertyOptional({
    enum: PaymentGatewayProvider,
    description: 'Active payment gateway. Required when ordersAndPaymentsEnabled is true.',
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsEnum(PaymentGatewayProvider)
  paymentProvider?: PaymentGatewayProvider | null;

  @ApiPropertyOptional({
    description:
      'Provider-specific config object. For ZARINPAL: { "merchantId": "..." }. Designed so new gateways can use their own shape.',
    example: { merchantId: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' },
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsObject()
  paymentGatewayConfig?: Record<string, unknown> | null;
}
