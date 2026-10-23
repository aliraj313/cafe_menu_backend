import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type NodeEnv = 'development' | 'test' | 'production';
export type PaymentProvider = 'mock' | 'zarinpal';

const NODE_ENVS: readonly NodeEnv[] = ['development', 'test', 'production'];
const PAYMENT_PROVIDERS: readonly PaymentProvider[] = ['mock', 'zarinpal'];

@Injectable()
export class ConfigsService {
  readonly NODE_ENV: NodeEnv;
  readonly PORT: number;
  readonly API_PREFIX: string;
  readonly DATABASE_URL: string;
  readonly BUSINESS_TIMEZONE: string;
  readonly FRONTEND_ORIGIN: string;
  readonly PUBLIC_MENU_BASE_URL: string;
  readonly UPLOAD_MAX_BYTES: number;

  readonly JWT: {
    readonly ACCESS: {
      readonly SECRET: string;
      readonly TTL: string;
    };
    readonly REFRESH: {
      readonly SECRET: string;
      readonly TTL: string;
    };
  };

  readonly ADMIN_SEED: {
    readonly MOBILE: string;
    readonly PASSWORD: string;
  };

  readonly OTP: {
    readonly TTL_SECONDS: number;
    readonly RESEND_COOLDOWN_SECONDS: number;
    readonly MAX_ATTEMPTS: number;
    readonly PEPPER: string;
    readonly DEMO_ENABLED: boolean;
  };

  readonly PAYMENT: {
    readonly PROVIDER: PaymentProvider;
    readonly MOCK_ENABLED: boolean;
    readonly ZARINPAL: {
      readonly MERCHANT_ID: string | undefined;
      readonly CALLBACK_URL: string | undefined;
     };
  };

  /** Application-wide constants (never hardcode these elsewhere). */
  readonly APP = {
    NAME: 'Cafe Menu Backend',
    DESCRIPTION: 'API for Persian cafe and restaurant menu application',
    API_DEFAULT_VERSION: '1',
    OPENAPI_VERSION: '1.0',
    DOCS_PATH: 'docs',
    OPENAPI_JSON_PATH: 'openapi.json',
    DOCS_EXCLUDE_ROUTES: ['docs', 'docs/(.*)', 'openapi.json'] as const,
    SCALAR_THEME: 'default' as const,
    SCALAR_DARK_MODE: true,
  };

  /** Singleton settings row and default profile values. */
  readonly SETTINGS = {
    SINGLETON_ID: 1,
    DEFAULT_CAFE_NAME: 'کافه من',
  };


  /** WebSocket (admin realtime) constants. */
  readonly WS = {
    NAMESPACE: 'admin',
    ROOM_ADMINS: 'admins',
    EVENTS: {
      ORDER_PAID: 'order.paid',
    },
  };

  /** Payment-related application constants (no hardcoding elsewhere). */
  readonly PAYMENT_APP = {
    PROVIDER_ZARINPAL: 'zarinpal',
    CURRENCY_IRT: 'IRT',
    SNAPSHOT_TYPE_ORDER: 'ORDER',
    ZARINPAL: {
      REQUEST_PATH: '/pg/v4/payment/request.json',
      VERIFY_PATH: '/pg/v4/payment/verify.json',
      START_PAY_PATH: '/pg/StartPay/',
      SANDBOX_BASE_URL: 'https://sandbox.zarinpal.com',
      PRODUCTION_BASE_URL: 'https://payment.zarinpal.com',
      SUCCESS_CODES: [100, 101] as const,
    },
    FRONTEND_SUCCESS_PATH: '/payment/success',
    FRONTEND_FAILURE_PATH: '/payment/failure',
  };

    /** Shared business / API limits used across modules. */
  readonly LIMITS = {
    PAGINATION: {
      DEFAULT_PAGE: 1,
      DEFAULT_LIMIT: 20,
      MAX_LIMIT: 100,
    },
    UPLOAD: {
      MIN_BYTES: 1024,
    },
    PORT: {
      MIN: 1,
      MAX: 65_535,
    },
    OTP: {
      MIN_TTL_SECONDS: 60,
      MIN_RESEND_COOLDOWN_SECONDS: 10,
      MIN_MAX_ATTEMPTS: 1,
    },
    AUTH: {
      BCRYPT_SALT_ROUNDS: 12,
      MIN_PASSWORD_LENGTH: 8,
      OTP_LENGTH: 6,
    },
    CART: {
      MIN_QUANTITY: 1,
      MAX_QUANTITY: 99,
      MAX_ITEMS: 50,
      /** Active cart lifetime in hours (then a new cart is created on next add). */
      TTL_HOURS: 24,
    },
  };

  constructor(private readonly configService: ConfigService) {
    this.NODE_ENV = this.parseNodeEnv(this.requireString('NODE_ENV'));
    this.PORT = this.parsePort(this.requireString('PORT'));
    this.API_PREFIX = this.requireNonEmptyString('API_PREFIX');
    this.DATABASE_URL = this.requireNonEmptyString('DATABASE_URL');
    this.BUSINESS_TIMEZONE = this.requireNonEmptyString('BUSINESS_TIMEZONE');
    this.FRONTEND_ORIGIN = this.requireNonEmptyString('FRONTEND_ORIGIN');
    this.PUBLIC_MENU_BASE_URL = this.requireNonEmptyString('PUBLIC_MENU_BASE_URL');
    this.UPLOAD_MAX_BYTES = this.parseUploadMaxBytes(this.requireString('UPLOAD_MAX_BYTES'));

    this.JWT = {
      ACCESS: {
        SECRET: this.requireNonEmptyString('JWT_ACCESS_SECRET'),
        TTL: this.requireNonEmptyString('JWT_ACCESS_TTL'),
      },
      REFRESH: {
        SECRET: this.requireNonEmptyString('JWT_REFRESH_SECRET'),
        TTL: this.requireNonEmptyString('JWT_REFRESH_TTL'),
      },
    };

    this.ADMIN_SEED = {
      MOBILE: this.parseMobile(this.requireNonEmptyString('ADMIN_MOBILE')),
      PASSWORD: this.requireNonEmptyString('ADMIN_PASSWORD'),
    };
    if (this.ADMIN_SEED.PASSWORD.length < this.LIMITS.AUTH.MIN_PASSWORD_LENGTH) {
      throw new Error(
        `ADMIN_PASSWORD must be at least ${this.LIMITS.AUTH.MIN_PASSWORD_LENGTH} characters`,
      );
    }

    this.OTP = {
      TTL_SECONDS: this.parseIntInRange(
        'OTP_TTL_SECONDS',
        this.LIMITS.OTP.MIN_TTL_SECONDS,
        Number.MAX_SAFE_INTEGER,
      ),
      RESEND_COOLDOWN_SECONDS: this.parseIntInRange(
        'OTP_RESEND_COOLDOWN_SECONDS',
        this.LIMITS.OTP.MIN_RESEND_COOLDOWN_SECONDS,
        Number.MAX_SAFE_INTEGER,
      ),
      MAX_ATTEMPTS: this.parseIntInRange(
        'OTP_MAX_ATTEMPTS',
        this.LIMITS.OTP.MIN_MAX_ATTEMPTS,
        Number.MAX_SAFE_INTEGER,
      ),
      PEPPER: this.requireNonEmptyString('OTP_PEPPER'),
      DEMO_ENABLED: this.requireBoolean('AUTH_DEMO_OTP_ENABLED'),
    };

    this.PAYMENT = {
      PROVIDER: this.parsePaymentProvider(this.requireString('PAYMENT_PROVIDER')),
      MOCK_ENABLED: this.requireBoolean('PAYMENT_MOCK_ENABLED'),
      ZARINPAL: {
        MERCHANT_ID: this.optionalNonEmptyString('ZARINPAL_MERCHANT_ID'),
        CALLBACK_URL: this.optionalUrl('ZARINPAL_CALLBACK_URL'),
       },
    };

    this.assertProductionSafety();
  }

  private assertProductionSafety(): void {
    if (this.NODE_ENV !== 'production') {
      return;
    }
    if (this.OTP.DEMO_ENABLED) {
      throw new Error('AUTH_DEMO_OTP_ENABLED must be false in production');
    }
    if (this.PAYMENT.MOCK_ENABLED) {
      throw new Error('PAYMENT_MOCK_ENABLED must be false in production');
    }
    if (!this.PAYMENT.ZARINPAL.CALLBACK_URL) {
      throw new Error('ZARINPAL_CALLBACK_URL is required in production');
    }
  }

  private requireString(key: string): string {
    const value = this.configService.get<unknown>(key);
    if (value === undefined || value === null) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
    return String(value).trim();
  }

  private requireNonEmptyString(key: string): string {
    const value = this.requireString(key);
    if (value.length === 0) {
      throw new Error(`Environment variable ${key} must not be empty`);
    }
    return value;
  }

  private optionalNonEmptyString(key: string): string | undefined {
    const value = this.configService.get<unknown>(key);
    if (value === undefined || value === null) {
      return undefined;
    }
    const normalized = String(value).trim();
    return normalized.length === 0 ? undefined : normalized;
  }

  private requireBoolean(key: string): boolean {
    const raw = this.configService.get<unknown>(key);
    if (typeof raw === 'boolean') {
      return raw;
    }
    if (raw === undefined || raw === null) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
    const normalized = String(raw).toLowerCase().trim();
    if (normalized === 'true' || normalized === '1') {
      return true;
    }
    if (normalized === 'false' || normalized === '0') {
      return false;
    }
    throw new Error(`Environment variable ${key} must be a boolean (true/false)`);
  }

  private parseIntInRange(key: string, min: number, max: number): number {
    const raw = this.requireString(key);
    const parsed = Number(raw);
    if (!Number.isInteger(parsed)) {
      throw new Error(`Environment variable ${key} must be an integer`);
    }
    if (parsed < min || parsed > max) {
      throw new Error(`Environment variable ${key} must be between ${min} and ${max}`);
    }
    return parsed;
  }

  private parsePort(raw: string): number {
    const parsed = Number(raw);
    if (!Number.isInteger(parsed)) {
      throw new Error('Environment variable PORT must be an integer');
    }
    if (parsed < this.LIMITS.PORT.MIN || parsed > this.LIMITS.PORT.MAX) {
      throw new Error(
        `Environment variable PORT must be between ${this.LIMITS.PORT.MIN} and ${this.LIMITS.PORT.MAX}`,
      );
    }
    return parsed;
  }

  private parseUploadMaxBytes(raw: string): number {
    const parsed = Number(raw);
    if (!Number.isInteger(parsed)) {
      throw new Error('Environment variable UPLOAD_MAX_BYTES must be an integer');
    }
    if (parsed < this.LIMITS.UPLOAD.MIN_BYTES) {
      throw new Error(
        `Environment variable UPLOAD_MAX_BYTES must be at least ${this.LIMITS.UPLOAD.MIN_BYTES}`,
      );
    }
    return parsed;
  }

  private parseNodeEnv(raw: string): NodeEnv {
    if (!NODE_ENVS.includes(raw as NodeEnv)) {
      throw new Error(`Environment variable NODE_ENV must be one of: ${NODE_ENVS.join(', ')}`);
    }
    return raw as NodeEnv;
  }

  private parsePaymentProvider(raw: string): PaymentProvider {
    if (!PAYMENT_PROVIDERS.includes(raw as PaymentProvider)) {
      throw new Error(
        `Environment variable PAYMENT_PROVIDER must be one of: ${PAYMENT_PROVIDERS.join(', ')}`,
      );
    }
    return raw as PaymentProvider;
  }

  private parseMobile(raw: string): string {
    const normalized = raw.trim();
    if (!/^09\d{9}$/.test(normalized)) {
      throw new Error('ADMIN_MOBILE must be a valid Iranian mobile number (09xxxxxxxxx)');
    }
    return normalized;
  }

  private optionalUrl(key: string): string | undefined {
    const value = this.optionalNonEmptyString(key);
    if (value === undefined) {
      return undefined;
    }
    try {
      // Allow localhost and non-TLD URLs used in development.
      // eslint-disable-next-line no-new
      new URL(value);
    } catch {
      throw new Error(`Environment variable ${key} must be a valid URL`);
    }
    return value;
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
