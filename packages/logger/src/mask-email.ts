export type MaskEmailInput = { email: string };

/** `anna@volvo.se` → `***@volvo.se`: enough to debug delivery, no personal data (ADR 0014). */
export function maskEmail({ email }: MaskEmailInput): string {
  const at = email.lastIndexOf("@");
  return at < 0 ? "***" : `***${email.slice(at)}`;
}
