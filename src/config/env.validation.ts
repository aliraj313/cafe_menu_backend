import { plainToInstance } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
  validateSync,
} from 'class-validator';

enum NodeEnv {
  Development = 'development',
  Test = 'test',
  Production = 'production',
}

enum PaymentProvider {
  Mock = 'mock',
  Zarinpal = 'zarinpal',
}

class EnvironmentVariables {
  @IsEnum(NodeEnv)
  NODE_ENV: NodeEnv = NodeEnv.Development;

  @IsInt()
  @Min(1)
  @Max(65535)
  PORT = 3000;

  @IsString()
  @IsNotEmpty()
  API_PREFIX = 'api/v1';

  @IsString()
  @IsNotEmpty()
  DATABASE_URL!: string;

  @IsString()
  @IsNotEmpty()
  BUSINESS_TIMEZONE = 'Asia/Tehran';

  @IsString()
  @IsNotEmpty()
  FRONTEND_ORIGIN!: string;

  @IsString()
  @IsNotEmpty()
  PUBLIC_MENU_BASE_URL!: string;

  @IsString()
  @IsNotEmpty()
  JWT_ACCESS_SECRET!: string;

  @IsString()
  @IsNotEmpty()
  JWT_ACCESS_TTL = '15m';

  @IsInt()
  @Min(60)
  OTP_TTL_SECONDS = 300;

  @IsInt()
  @Min(10)
  OTP_RESEND_COOLDOWN_SECONDS = 60;

  @IsInt()
  @Min(1)
  OTP_MAX_ATTEMPTS = 5;

  @IsString()
  @IsNotEmpty()
  OTP_PEPPER!: string;

  @IsBoolean()
  AUTH_DEMO_OTP_ENABLED = true;

  @IsEnum(PaymentProvider)
  PAYMENT_PROVIDER: PaymentProvider = PaymentProvider.Mock;

  @IsBoolean()
  PAYMENT_MOCK_ENABLED = true;

  @IsOptional()
  @IsString()
  ZARINPAL_MERCHANT_ID?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  ZARINPAL_CALLBACK_URL?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  ZARINPAL_API_BASE_URL?: string;

  @IsInt()
  @Min(1024)
  UPLOAD_MAX_BYTES = 5_242_880;
}

export function validateEnv(config: Record<string, unknown>): EnvironmentVariables {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validated, { skipMissingProperties: false });

  if (errors.length > 0) {
    const messages = errors.map((e) => Object.values(e.constraints ?? {}).join(', ')).join('; ');
    throw new Error(`Environment validation failed: ${messages}`);
  }

  if (validated.NODE_ENV === NodeEnv.Production) {
    if (validated.AUTH_DEMO_OTP_ENABLED) {
      throw new Error('AUTH_DEMO_OTP_ENABLED must be false in production');
    }
    if (validated.PAYMENT_MOCK_ENABLED) {
      throw new Error('PAYMENT_MOCK_ENABLED must be false in production');
    }
  }

  return validated;
}
