import { Injectable, Logger } from '@nestjs/common';
import { FakeSmsProvider } from './provider/fake-sms.provider.js';
import type { SmsProvider } from './provider/sms-provider.interface.js';

@Injectable()
export class SmsService {
  private readonly provider: SmsProvider;

  constructor() {
    const name = process.env['SMS_PROVIDER'] ?? 'fake';
    switch (name) {
      // case 'twilio': this.provider = new TwilioSmsProvider(); break;
      default:
        this.provider = new FakeSmsProvider();
    }
    new Logger(SmsService.name).log(`SMS provider: ${this.provider.name}`);
  }

  sendCode(phone: string) {
    return this.provider.sendCode(phone);
  }

  verifyCode(phone: string, code: string) {
    return this.provider.verifyCode(phone, code);
  }
}
