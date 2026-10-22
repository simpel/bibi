import type { EntityTypeDto } from "@bibi/core";
import type { FieldSpec } from "@bibi/core/schemas";

/** A type's own field as a form control holds it: text inputs are strings. */
export type RawFieldValue = string | boolean | string[];

/** Form values that carry a typed record's own fields under `fields`, by field key. */
export type WithRawFields = { fields: Record<string, RawFieldValue> };

const text = ({ value }: { value: unknown }) =>
  value === null || value === undefined ? "" : String(value);

export type RawFieldsInput = { type: EntityTypeDto | undefined; stored: Record<string, unknown> };

/** Raw field values for a type: stored values of a record where present, else empty. */
export function rawFields({ type, stored }: RawFieldsInput): Record<string, RawFieldValue> {
  const raw: Record<string, RawFieldValue> = {};
  for (const { key, kind } of type?.fields ?? []) {
    const value = stored[key];
    if (kind === "BOOLEAN") raw[key] = value === true;
    else if (kind === "MULTI_CHOICE") raw[key] = Array.isArray(value) ? value.map(String) : [];
    else raw[key] = text({ value });
  }
  return raw;
}

type FieldInput = { spec: FieldSpec; raw: RawFieldValue | undefined };

/** One raw control value → the typed value of its kind; `undefined` = empty, left out. */
function fieldValue({ spec, raw }: FieldInput): unknown {
  if (spec.kind === "BOOLEAN") return raw === true;
  if (spec.kind === "MULTI_CHOICE") return Array.isArray(raw) && raw.length > 0 ? raw : undefined;
  const value = typeof raw === "string" ? raw.trim() : "";
  if (value === "") return undefined;
  return spec.kind === "NUMBER" ? Number(value.replace(",", ".")) : value;
}

export type FieldsToInputArgs = { values: WithRawFields; specs: readonly FieldSpec[] };

/** Typed `fields` JSON by key; empty values are left out. */
export function fieldsToInput({ values, specs }: FieldsToInputArgs): Record<string, unknown> {
  const fields: Record<string, unknown> = {};
  for (const spec of specs) {
    const value = fieldValue({ spec, raw: values.fields[spec.key] });
    if (value !== undefined) fields[spec.key] = value;
  }
  return fields;
}

export type FieldsPatchInput = {
  type: EntityTypeDto | undefined;
  stored: Record<string, unknown>;
  fields: Record<string, unknown> | undefined;
};

/**
 * `fields` for an `*.update` input. Core merges `fields` per key, so a field that was set and
 * is now empty is sent as `null` to clear it.
 */
export function fieldsPatch({ type, stored, fields }: FieldsPatchInput): Record<string, unknown> {
  const cleared: Record<string, null> = {};
  for (const { key } of type?.fields ?? []) {
    if (stored[key] !== undefined && fields?.[key] === undefined) cleared[key] = null;
  }
  return { ...fields, ...cleared };
}
