export interface SmsMessage {
  to: string;
  text: string;
}

export interface SmsService {
  send(message: SmsMessage): Promise<void>;
}

export const SMS_SERVICE = Symbol('SMS_SERVICE');
