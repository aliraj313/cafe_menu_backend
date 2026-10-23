import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type NodeEnv = 'development' | 'test' | 'production';
export type PaymentProvider = 'mock' | 'zarinpal';
export type SmsProvider = 'mock' | 'smsir';

const NODE_ENVS: readonly NodeEnv[] = ['development', 'test', 'production'];
const PAYMENT_PROVIDERS: readonly PaymentProvider[] = ['mock', 'zarinpal'];

@Injectable()
export class ConfigsService {
  readonly NODE_ENV: NodeEnv;
  readonly PORT: number;
  readonly DATABASE_URL: string;
  readonly FRONTEND_ORIGIN: string;
  readonly PUBLIC_MENU_BASE_URL: string;

  /** Fixed business timezone (not env-driven). */
  readonly BUSINESS_TIMEZONE = 'Asia/Tehran' as const;

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

  /** OTP policy constants (not env-driven). */
  readonly OTP = {
    TTL_SECONDS: 300,
    RESEND_COOLDOWN_SECONDS: 60,
    MAX_ATTEMPTS: 5,
    PEPPER: 'cafe-menu-otp-pepper-v1',
  } as const;

  readonly SMS: {
    readonly PROVIDER: SmsProvider;
    readonly SMSIR: {
      readonly API_KEY: string | undefined;
      readonly LOGIN_OTP_TEMPLATE_ID: number | undefined;
      readonly PASSWORD_RESET_OTP_TEMPLATE_ID: number | undefined;
      readonly OTP_PARAM_NAME: string;
    };
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

  readonly SMS_APP = {
    DEFAULT_API_BASE_URL: 'https://api.sms.ir/v1',
    VERIFY_PATH: '/send/verify',
    DEFAULT_OTP_PARAM_NAME: 'Code',
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
    PORT: {
      MIN: 1,
      MAX: 65_535,
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
    DASHBOARD: {
      RECENT_ORDERS_LIMIT: 10,
    },
  };

  constructor(private readonly configService: ConfigService) {
    this.NODE_ENV = this.parseNodeEnv(this.requireString('NODE_ENV'));
    this.PORT = this.parsePort(this.requireString('PORT'));
    this.DATABASE_URL = this.requireNonEmptyString('DATABASE_URL');
    this.FRONTEND_ORIGIN = this.requireNonEmptyString('FRONTEND_ORIGIN');
    this.PUBLIC_MENU_BASE_URL = this.requireNonEmptyString('PUBLIC_MENU_BASE_URL');

    this.JWT = {
      ACCESS: {
        SECRET: this.requireNonEmptyString('JWT_ACCESS_SECRET'),
        TTL: '1d',
      },
      REFRESH: {
        SECRET: this.requireNonEmptyString('JWT_REFRESH_SECRET'),
        TTL: '365d',
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


    // Production always uses SMS.ir; non-production always uses mock (no SMS_PROVIDER env).
    this.SMS = {
      PROVIDER: this.NODE_ENV === 'production' ? 'smsir' : 'mock',
      SMSIR: {
        API_KEY: this.optionalNonEmptyString('SMS_IR_API_KEY'),
        LOGIN_OTP_TEMPLATE_ID: this.optionalPositiveInt('SMS_IR_LOGIN_OTP_TEMPLATE_ID'),
        PASSWORD_RESET_OTP_TEMPLATE_ID: this.optionalPositiveInt(
          'SMS_IR_PASSWORD_RESET_OTP_TEMPLATE_ID',
        ),
        OTP_PARAM_NAME:
          this.optionalNonEmptyString('SMS_IR_OTP_PARAM_NAME') ??
          this.SMS_APP.DEFAULT_OTP_PARAM_NAME,
      },
    };

    this.PAYMENT = {
      PROVIDER: this.parsePaymentProvider(this.requireString('PAYMENT_PROVIDER')),
      // Mock payment flows active in non-production only
      MOCK_ENABLED: this.NODE_ENV !== 'production',
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
    if (!this.PAYMENT.ZARINPAL.CALLBACK_URL) {
      throw new Error('ZARINPAL_CALLBACK_URL is required in production');
    }
    if (!this.SMS.SMSIR.API_KEY) {
      throw new Error('SMS_IR_API_KEY is required in production');
    }
    if (!this.SMS.SMSIR.LOGIN_OTP_TEMPLATE_ID) {
      throw new Error('SMS_IR_LOGIN_OTP_TEMPLATE_ID is required in production');
    }
    if (!this.SMS.SMSIR.PASSWORD_RESET_OTP_TEMPLATE_ID) {
      throw new Error('SMS_IR_PASSWORD_RESET_OTP_TEMPLATE_ID is required in production');
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


  private optionalPositiveInt(key: string): number | undefined {
    const value = this.optionalNonEmptyString(key);
    if (value === undefined) {
      return undefined;
    }
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      throw new Error(`Environment variable ${key} must be a positive integer`);
    }
    return parsed;
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
