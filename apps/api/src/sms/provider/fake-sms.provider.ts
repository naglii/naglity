import { Logger } from '@nestjs/common';
import type { SmsProvider } from './sms-provider.interface.js';

/** The code that always passes in fake mode. */
export const FAKE_SMS_CODE = '0000';
const TTL_MS = 10 * 60 * 1000; // codes are valid for 10 minutes

/** Digits-only, so "050-123 4567" and "0501234567" are treated as the same number. */
const normalize = (phone: string) => (phone ?? '').replace(/\D/g, '');

/**
 * Offline SMS: logs the code instead of sending. `0000` verifies — but ONLY for a
 * phone that a code was actually "sent" to. This binds the code to the number, so
 * you can't verify a phone you never requested a code for.
 */
export class FakeSmsProvider implements SmsProvider {
  readonly name = 'fake';
  private readonly logger = new Logger('FakeSms');
  // normalized phone -> expiry timestamp of the issued code
  private readonly issued = new Map<string, number>();

  async sendCode(phone: string): Promise<void> {
    this.issued.set(normalize(phone), Date.now() + TTL_MS);
    this.logger.log(`Verification code for ${phone}: ${FAKE_SMS_CODE} (fake SMS — enter ${FAKE_SMS_CODE})`);
  }

  verifyCode(phone: string, code: string): boolean {
    const expiry = this.issued.get(normalize(phone));
    // Reject if no code was sent to THIS phone, or it expired.
    if (!expiry || Date.now() > expiry) return false;
    return (code ?? '').trim() === FAKE_SMS_CODE;
  }
}
