/**
 * Email input cleaning and key validation.
 */

export type CleanEmailInput = { value: string };

/**
 * Cleans an email address: trims whitespace and removes embedded spaces.
 */
export function cleanEmail({ value }: CleanEmailInput): string {
  return value.trim().replace(/\s+/g, "");
}

export type KeyAllowedEmailInput = {
  key: string;
  ctrlOrMeta: boolean;
};

/**
 * Validates whether a keypress should be allowed in an email input.
 * Spaces are strictly disallowed.
 */
export function isAllowedEmailKey({ key, ctrlOrMeta }: KeyAllowedEmailInput): boolean {
  if (ctrlOrMeta) return true;
  if (key === " " || key === "Spacebar") return false;
  return true;
}

export type ValidEmailInput = { value: string };

/** Standard email pattern (HTML5 / RFC 5322 subset). */
const EMAIL_PATTERN =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

/**
 * Returns whether the string is a valid email address.
 */
export function isValidEmail({ value }: ValidEmailInput): boolean {
  const cleaned = cleanEmail({ value });
  if (cleaned.length === 0 || cleaned.length > 254) return false;
  return EMAIL_PATTERN.test(cleaned);
}
