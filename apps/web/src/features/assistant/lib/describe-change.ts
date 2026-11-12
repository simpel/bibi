import type { ChangePreview } from "@bibi/core/schemas";
import { fieldKey } from "./approval-labels";

type FieldChange = ChangePreview["changes"][number]["fields"][number];

/** One part of a field's path: a localizable field key, a record's name or the raw text. */
export type PathSegment =
  | { kind: "field"; key: NonNullable<ReturnType<typeof fieldKey>> }
  | { kind: "text"; text: string };

export type DescribedValue =
  | { kind: "empty" }
  | { kind: "money"; minor: number }
  | { kind: "yesNo"; value: boolean }
  | { kind: "text"; text: string };

export type DescribedChange = {
  segments: PathSegment[];
  before: DescribedValue;
  after: DescribedValue;
};

type Names = ChangePreview["names"];

function segmentOf({ part, names }: { part: string; names: Names }): PathSegment {
  const name = names[part];
  if (name) return { kind: "text", text: name };
  // An amount in minor units is shown as money, so it gets the plain label (priceMinor → price).
  const key = fieldKey({ key: part.replace(/Minor$/, "") }) ?? fieldKey({ key: part });
  return key ? { kind: "field", key } : { kind: "text", text: part };
}

function describeValue({
  value,
  path,
  names,
}: {
  value: unknown;
  path: string;
  names: Names;
}): DescribedValue {
  if (value === undefined || value === null || value === "") return { kind: "empty" };
  if (typeof value === "number" && path.endsWith("Minor")) return { kind: "money", minor: value };
  if (typeof value === "boolean") return { kind: "yesNo", value };
  if (typeof value === "string") return { kind: "text", text: names[value] ?? value };
  if (Array.isArray(value)) {
    const items = value.map((item) =>
      typeof item === "string" ? (names[item] ?? item) : JSON.stringify(item),
    );
    return { kind: "text", text: items.join(", ") };
  }
  return { kind: "text", text: typeof value === "object" ? JSON.stringify(value) : String(value) };
}

export type DescribeFieldChangeInput = { change: FieldChange; names: Names };

/**
 * A field change as the approval card shows it (ADR 0049): ids in the path and values become the
 * records' names, known fields get their label, amounts in minor units are shown as money.
 */
export function describeFieldChange({ change, names }: DescribeFieldChangeInput): DescribedChange {
  return {
    segments: change.path.split(".").map((part) => segmentOf({ part, names })),
    before: describeValue({ value: change.before, path: change.path, names }),
    after: describeValue({ value: change.after, path: change.path, names }),
  };
}

type RecordChange = ChangePreview["changes"][number];

/** Bookkeeping a new record always gets: shown on an update, left out of a create. */
const CREATE_BOOKKEEPING: Readonly<Record<string, unknown>> = { status: "ACTIVE" };

export type VisibleFieldsInput = { change: RecordChange };

/**
 * The fields of a record change worth showing: a create leaves out its bookkeeping (a new record
 * is active, its position is where it lands), so the card shows only what the user asked for.
 */
export function visibleFields({ change }: VisibleFieldsInput): FieldChange[] {
  if (change.kind !== "create") return change.fields;
  return change.fields.filter(
    ({ path, after }) => path !== "position" && CREATE_BOOKKEEPING[path] !== after,
  );
}
