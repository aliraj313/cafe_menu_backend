import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type NodeEnv = 'development' | 'test' | 'production';
export type PaymentProvider = 'mock' | 'zarinpal';

@Injectable()
export class ConfigsService {
  constructor(private readonly configService: ConfigService) {}

  NODE_ENV: NodeEnv = this.getEnv('NODE_ENV') as NodeEnv;
  PORT = this.getEnvNumber('PORT');
  API_PREFIX = this.getEnv('API_PREFIX');
  DATABASE_URL = this.getEnv('DATABASE_URL');
  BUSINESS_TIMEZONE = this.getEnv('BUSINESS_TIMEZONE');
  FRONTEND_ORIGIN = this.getEnv('FRONTEND_ORIGIN');
  PUBLIC_MENU_BASE_URL = this.getEnv('PUBLIC_MENU_BASE_URL');
  UPLOAD_MAX_BYTES = this.getEnvNumber('UPLOAD_MAX_BYTES');

  JWT = {
    ACCESS: {
      SECRET: this.getEnv('JWT_ACCESS_SECRET'),
      TTL: this.getEnv('JWT_ACCESS_TTL'),
    },
  };

  OTP = {
    TTL_SECONDS: this.getEnvNumber('OTP_TTL_SECONDS'),
    RESEND_COOLDOWN_SECONDS: this.getEnvNumber('OTP_RESEND_COOLDOWN_SECONDS'),
    MAX_ATTEMPTS: this.getEnvNumber('OTP_MAX_ATTEMPTS'),
    PEPPER: this.getEnv('OTP_PEPPER'),
    DEMO_ENABLED: this.getEnvBoolean('AUTH_DEMO_OTP_ENABLED'),
  };

  PAYMENT = {
    PROVIDER: this.getEnv('PAYMENT_PROVIDER') as PaymentProvider,
    MOCK_ENABLED: this.getEnvBoolean('PAYMENT_MOCK_ENABLED'),
    ZARINPAL: {
      MERCHANT_ID: this.getOptionalEnv('ZARINPAL_MERCHANT_ID'),
      CALLBACK_URL: this.getOptionalEnv('ZARINPAL_CALLBACK_URL'),
      API_BASE_URL: this.getOptionalEnv('ZARINPAL_API_BASE_URL'),
    },
  };

  getEnv(key: string): string {
    return this.configService.getOrThrow<string>(key);
  }

  getOptionalEnv(key: string): string | undefined {
    const value = this.configService.get<string>(key);
    if (value === undefined || value === '') {
      return undefined;
    }
    return value;
  }

  getEnvNumber(key: string): number {
    const value = this.configService.getOrThrow<string | number>(key);
    const parsed = typeof value === 'number' ? value : Number(value);
    if (Number.isNaN(parsed)) {
      throw new Error(`Environment variable ${key} must be a valid number`);
    }
    return parsed;
  }

  getEnvBoolean(key: string): boolean {
    const value = this.configService.getOrThrow<string | boolean>(key);
    if (typeof value === 'boolean') {
      return value;
    }
    const normalized = value.toLowerCase().trim();
    if (normalized === 'true' || normalized === '1') {
      return true;
    }
    if (normalized === 'false' || normalized === '0') {
      return false;
    }
    throw new Error(`Environment variable ${key} must be a boolean`);
  }
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

export function isTest(): boolean {
  return process.env.NODE_ENV === 'test';
}
