import { createHash } from "node:crypto";

/**
 * Swish's instruction id (32 upper-case hex) derived from Bibi's idempotency key: a retried
 * request reuses the id, so Swish never creates a second request or refund for it.
 */
export const swishInstructionId = ({ key }: { key: string }): string =>
  createHash("sha256").update(key).digest("hex").slice(0, 32).toUpperCase();

/** Minor units as Swish's decimal string: 12345 → "123.45". */
export function swishAmount({ minor }: { minor: number }): string {
  const sign = minor < 0 ? "-" : "";
  const abs = Math.abs(Math.trunc(minor));
  return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}

/** Swish's decimal amount back to minor units. */
export const swishMinor = ({ amount }: { amount: number | string }): number =>
  Math.round(Number(amount) * 100);

/** The characters Swish accepts in a message, at most 50 of them. */
export function swishMessage({ text }: { text: string }): string {
  return text
    .replace(/[^\p{L}\p{N} :;.,?!()"'-]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 50);
}

/** A payee reference Swish accepts (1–35 letters and digits). */
export const swishReference = ({ value }: { value: string }): string =>
  value.replace(/[^A-Za-z0-9]/g, "").slice(0, 35);
