/** Mail domains people use privately: they say nothing about the customer. */
const FREE_MAIL = new Set([
  "gmail.com",
  "googlemail.com",
  "hotmail.com",
  "hotmail.se",
  "outlook.com",
  "live.com",
  "live.se",
  "icloud.com",
  "me.com",
  "yahoo.com",
  "yahoo.se",
  "proton.me",
  "protonmail.com",
  "telia.com",
  "spray.se",
]);

export type CustomerHintInput = { fromEmail: string | null };

/**
 * What the customer search starts with when the intake opens from a message (ADR 0085): the
 * company part of the sender's mail domain (`anna@volvocars.com` → `volvocars`). Null for a free
 * mail domain or no email, so the search starts empty.
 */
export function customerHint({ fromEmail }: CustomerHintInput): string | null {
  const domain = fromEmail?.split("@")[1]?.trim().toLowerCase();
  if (!domain || FREE_MAIL.has(domain)) return null;
  const labels = domain.split(".").filter(Boolean);
  const company = labels.length >= 2 ? labels[labels.length - 2] : labels[0];
  return company && company.length >= 2 ? company : null;
}
