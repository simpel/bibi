/** One changed field of an audit entry: its value before and after (`undefined` = absent). */
export type AuditChange = { field: string; before: unknown; after: unknown };

/** Bookkeeping fields that change on every write and say nothing about the change itself. */
const IGNORED = new Set(["id", "organizationId", "createdAt", "updatedAt", "createdBy"]);

const asRecord = ({ value }: { value: unknown }): Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const same = ({ a, b }: { a: unknown; b: unknown }) => JSON.stringify(a) === JSON.stringify(b);

export type AuditDiffInput = { before: unknown; after: unknown };

/**
 * Fields that differ between the before and after image, in the order they appear. A create
 * (no before) lists every set field; an archive typically shows only `status`.
 */
export function auditDiff({ before, after }: AuditDiffInput): AuditChange[] {
  const from = asRecord({ value: before });
  const to = asRecord({ value: after });
  const fields = [...new Set([...Object.keys(from), ...Object.keys(to)])];
  return fields
    .filter((field) => !IGNORED.has(field))
    .filter((field) => !same({ a: from[field], b: to[field] }))
    .filter((field) => before !== null || (to[field] !== null && to[field] !== undefined))
    .map((field) => ({ field, before: from[field], after: to[field] }));
}

export type FormatAuditValueInput = { value: unknown };

/** Short display text for one value; objects and lists as compact JSON. */
export function formatAuditValue({ value }: FormatAuditValueInput): string {
  if (value === undefined || value === null || value === "") return "–";
  if (typeof value === "string") return value;
  const text = JSON.stringify(value);
  return text.length > 120 ? `${text.slice(0, 117)}…` : text;
}
