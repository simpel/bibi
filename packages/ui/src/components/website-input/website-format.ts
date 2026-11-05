/**
 * Website URL normalization and validation helpers.
 */

export type NormalizeWebsiteInput = { value: string };

/**
 * Trims and normalizes a website URL.
 * Automatically adds `https://` if the protocol was omitted by the user.
 */
export function normalizeWebsiteUrl({ value }: NormalizeWebsiteInput): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  return `https://${trimmed}`;
}

export type ValidWebsiteInput = { value: string };

/**
 * Validates whether a string can be parsed as a valid HTTP/HTTPS URL with a domain.
 */
export function isValidWebsiteUrl({ value }: ValidWebsiteInput): boolean {
  const normalized = normalizeWebsiteUrl({ value });
  if (!normalized) return false;
  try {
    const url = new URL(normalized);
    return (url.protocol === "http:" || url.protocol === "https:") && url.hostname.includes(".");
  } catch {
    return false;
  }
}
