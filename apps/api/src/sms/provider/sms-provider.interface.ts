/** SMS one-time-code provider. Fake today; a real Twilio/Vonage provider slots
 *  in behind the same interface later (selected by SMS_PROVIDER). */
export interface SmsProvider {
  readonly name: string;
  /** "Send" a verification code to the phone. */
  sendCode(phone: string): Promise<void>;
  /** Check a code the user typed. */
  verifyCode(phone: string, code: string): boolean;
}
