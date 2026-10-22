import { PaymentGatewayProvider } from '../generated/prisma/client';
import { BusinessRuleException } from '../common/exceptions/app.exception';
import { ConfigsService } from '../config/configs.service';

/**
 * Validates provider-specific paymentGatewayConfig shapes.
 * Extend the switch when adding a new PaymentGatewayProvider.
 */
export function validatePaymentGatewayConfig(
  provider: PaymentGatewayProvider,
  config: Record<string, unknown> | null | undefined,
  configs: ConfigsService,
): Record<string, unknown> {
  if (config === null || config === undefined) {
    throw new BusinessRuleException(
      'PAYMENT_GATEWAY_CONFIG_REQUIRED',
      'paymentGatewayConfig is required when orders and payments are enabled.',
    );
  }

  switch (provider) {
    case PaymentGatewayProvider.ZARINPAL: {
      const merchantId = config.merchantId;
      if (typeof merchantId !== 'string' || merchantId.trim().length === 0) {
        throw new BusinessRuleException(
          'ZARINPAL_MERCHANT_ID_REQUIRED',
          'Zarinpal paymentGatewayConfig.merchantId is required and must be a non-empty string.',
        );
      }
      // Keep only known keys so unknown fields do not leak into storage.
      const allowed = configs.PAYMENT_GATEWAYS.ZARINPAL.CONFIG_KEYS;
      const normalized: Record<string, unknown> = {};
      for (const key of allowed) {
        if (key in config) {
          normalized[key] = config[key];
        }
      }
      normalized.merchantId = merchantId.trim();
      return normalized;
    }
    default: {
      const _exhaustive: never = provider;
      throw new BusinessRuleException(
        'UNSUPPORTED_PAYMENT_PROVIDER',
        `Unsupported payment provider: ${String(_exhaustive)}`,
      );
    }
  }
}
