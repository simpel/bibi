/** What a redacted personal value is replaced with (ADR 0032). The key itself is kept. */
export const REDACTED = "[redacted]";

/**
 * Keys that hold personal data on any entity, at any depth: contact details, addresses, free
 * text from people (mail bodies, chat parts, status reasons) and the organization's own `fields`,
 * whose content the code cannot know (configurable domain, ADR 0021), so it is always redacted.
 */
const PERSONAL_KEYS = new Set([
  "email",
  "phone",
  "contactEmail",
  "contactPhone",
  "fromAddress",
  "toAddresses",
  "invoiceStreetAddress",
  "invoicePostalCode",
  "invoiceCity",
  "subject",
  "text",
  "html",
  "parts",
  "fields",
  "statusReason",
]);

/** Extra keys that are personal on entity types describing a person or their own content. */
const PERSONAL_KEYS_BY_ENTITY = new Map<string, readonly string[]>([
  ["customer", ["name"]],
  ["contact", ["name"]],
  ["member", ["name"]],
  ["conversation", ["title"]],
  ["message", ["metadata"]],
  ["inboundEmail", ["attachments"]],
]);

export type RedactAuditImageInput = { value: unknown; entityType: string | null };

type Walk = { value: unknown; keys: ReadonlySet<string> };

function walk({ value, keys }: Walk): unknown {
  if (Array.isArray(value)) return value.map((entry) => walk({ value: entry, keys }));
  if (value === null || typeof value !== "object") return value;
  const entries = Object.entries(value).map(([key, entry]) => [
    key,
    keys.has(key) && entry !== null ? REDACTED : walk({ value: entry, keys }),
  ]);
  return Object.fromEntries(entries);
}

/**
 * A copy of an AuditLog `before`/`after` image with personal values replaced by `REDACTED`
 * (ADR 0032). Ids, timestamps, amounts and other non-personal values stay, so the trail still
 * shows what changed and when. Null values stay null (nothing to redact).
 */
export function redactAuditImage({ value, entityType }: RedactAuditImageInput): unknown {
  const extra = (entityType && PERSONAL_KEYS_BY_ENTITY.get(entityType)) || [];
  return walk({ value, keys: new Set([...PERSONAL_KEYS, ...extra]) });
}
