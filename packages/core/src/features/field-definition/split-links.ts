import type { LinkValue } from "../../records/record-links";
import type { FieldSpec } from "./fields-schema";

type FieldValues = Record<string, unknown>;

/** Validated field values as stored (ADR 0056): scalars and choices as JSON, links as rows. */
export type CheckedFields = { fields: FieldValues; links: LinkValue[] };

export type SplitLinksInput = { specs: readonly FieldSpec[]; values: FieldValues };

/**
 * Splits validated values: `LINK` values become `RecordLink` rows, so no link id is stored in
 * `fields` JSON. Every LINK field of the type gets an entry (empty when unset), so a write
 * replaces the record's links as a whole.
 */
export function splitLinks({ specs, values }: SplitLinksInput): CheckedFields {
  const fields: FieldValues = {};
  const links: LinkValue[] = [];
  const linkSpecs = new Map(specs.filter((spec) => spec.kind === "LINK").map((s) => [s.key, s]));
  for (const [key, value] of Object.entries(values)) {
    if (!linkSpecs.has(key)) fields[key] = value;
  }
  for (const [key, spec] of linkSpecs) {
    const value = values[key];
    const targetIds = Array.isArray(value) ? value.map(String) : value ? [String(value)] : [];
    if (spec.id && targetIds.length > 0) links.push({ fieldId: spec.id, targetIds });
  }
  return { fields, links };
}
