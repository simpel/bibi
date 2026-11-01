/**
 * Public mail providers (ADR 0078): an address there says nothing about where someone works, so
 * no organization can claim the domain. Mirrored in the `domain_join` migration's backfill.
 */
export const PUBLIC_EMAIL_DOMAINS: ReadonlySet<string> = new Set([
  "gmail.com",
  "googlemail.com",
  "outlook.com",
  "hotmail.com",
  "hotmail.se",
  "live.com",
  "live.se",
  "msn.com",
  "yahoo.com",
  "yahoo.se",
  "icloud.com",
  "me.com",
  "mac.com",
  "aol.com",
  "proton.me",
  "protonmail.com",
  "gmx.com",
  "gmx.net",
  "mail.com",
  "telia.com",
  "spray.se",
  "bredband.net",
  "outlook.se",
  "hotmail.co.uk",
  "live.co.uk",
  "yahoo.co.uk",
  "ymail.com",
  "aim.com",
  "gmx.se",
  "gmx.de",
  "web.de",
  "pm.me",
  "protonmail.ch",
  "fastmail.com",
  "tutanota.com",
  "tuta.io",
  "zoho.com",
  "hey.com",
  "yandex.com",
  "yandex.ru",
  "qq.com",
  "163.com",
  "tele2.se",
  "comhem.se",
  "bahnhof.se",
  "glocalnet.net",
  "home.se",
  "passagen.se",
  "swipnet.se",
  // Reserved example domains: shared by tests and docs, never one organization's.
  "example.com",
  "example.se",
  "example.org",
  "example.net",
  "example.test",
]);

export type EmailDomainOfInput = { email: string };

/** The lowercase domain of an address, or `null` for a malformed or public one (ADR 0078). */
export function emailDomainOf({ email }: EmailDomainOfInput): string | null {
  const at = email.lastIndexOf("@");
  const domain =
    at > 0
      ? email
          .slice(at + 1)
          .trim()
          .toLowerCase()
      : "";
  if (!domain.includes(".") || PUBLIC_EMAIL_DOMAINS.has(domain)) return null;
  return domain;
}
