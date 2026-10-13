import { createHash } from "node:crypto";

export type CanonicalInput = { value: unknown };

/** Deterministic JSON (sorted object keys) so equal inputs hash equally. */
export function canonicalJson({ value }: CanonicalInput): string {
  if (Array.isArray(value)) return `[${value.map((item) => canonicalJson({ value: item })).join(",")}]`;
  if (value !== null && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, item]) => item !== undefined)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson({ value: item })}`);
    return `{${entries.join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

export function hashInput({ value }: CanonicalInput): string {
  return createHash("sha256").update(canonicalJson({ value })).digest("hex");
}
