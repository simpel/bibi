import type { z } from "zod";

/** Postal code formats by ISO 3166-1 alpha-2 country, as people type them (spaces optional). */
const POSTAL_CODE_PATTERNS: Record<string, RegExp> = {
  SE: /^\d{3} ?\d{2}$/,
  NO: /^\d{4}$/,
  DK: /^\d{4}$/,
  FI: /^\d{5}$/,
  IS: /^\d{3}$/,
  EE: /^\d{5}$/,
  DE: /^\d{5}$/,
  FR: /^\d{5}$/,
  ES: /^\d{5}$/,
  IT: /^\d{5}$/,
  PL: /^\d{2}-\d{3}$/,
  NL: /^\d{4} ?[A-Za-z]{2}$/,
  GB: /^[A-Za-z]{1,2}\d[A-Za-z\d]? ?\d[A-Za-z]{2}$/,
  US: /^\d{5}(-\d{4})?$/,
};

/** Any other country: letters, digits, spaces and hyphens, 2–10 characters, at least one digit. */
const GENERIC_PATTERN = /^(?=.*\d)[A-Za-z\d][A-Za-z\d -]{1,9}$/;

export type PostalCodeInput = { postalCode: string; country?: string | undefined };

/** True when `postalCode` matches the country's format (a generic rule when the country is unknown). */
export function isValidPostalCode({ postalCode, country }: PostalCodeInput): boolean {
  const pattern = (country && POSTAL_CODE_PATTERNS[country.toUpperCase()]) || GENERIC_PATTERN;
  return pattern.test(postalCode.trim());
}

export type PostalCodeCheckInput = {
  postalCode: string | null | undefined;
  country: string | undefined;
  /** The postal code's field name, where the issue goes. */
  path: string;
  ctx: z.RefinementCtx;
};

/**
 * Object-level check (the format depends on the country): adds a `custom` issue on `path` with
 * `params.key = "invalidPostalCode"` and no message, so forms can localize it.
 */
export function checkPostalCode({ postalCode, country, path, ctx }: PostalCodeCheckInput): void {
  if (postalCode == null || isValidPostalCode({ postalCode, country })) return;
  ctx.addIssue({ code: "custom", path: [path], params: { key: "invalidPostalCode" } });
}
