export type LocalizedTexts = { sv?: string | undefined; en?: string | undefined };

export type PickTextInput = { texts: LocalizedTexts; locale: string };

/** The page's text in the visitor's language, else the other one; null when neither is written. */
export function pickText({ texts, locale }: PickTextInput): string | null {
  const own = locale === "en" ? texts.en : texts.sv;
  const other = locale === "en" ? texts.sv : texts.en;
  return own?.trim() || other?.trim() || null;
}

/** `anna@volvo.se` → `a…@volvo.se`: enough for the guest to recognise their address. */
export function emailHint({ email }: { email: string }): string {
  const at = email.lastIndexOf("@");
  if (at < 1) return "…";
  return `${email.slice(0, 1)}…${email.slice(at)}`;
}
