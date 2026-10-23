export interface SmsMessage {
  to: string;
  text: string;
}

export interface SmsOtpMessage {
  to: string;
  code: string;
  /** Optional purpose for logging / future template routing */
  purpose?: 'LOGIN' | 'PASSWORD_RESET';
}

export interface SmsService {
  /** Generic plain-text send (mock / future bulk). */
  send(message: SmsMessage): Promise<void>;
  /** High-priority OTP via provider verify/template API when available. */
  sendOtp(message: SmsOtpMessage): Promise<void>;
}

export const SMS_SERVICE = Symbol('SMS_SERVICE');
