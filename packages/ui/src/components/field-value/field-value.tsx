import { Badge } from "../badge/badge";

export type FieldValueKind =
  | "TEXT"
  | "NUMBER"
  | "BOOLEAN"
  | "DATE"
  | "CHOICE"
  | "MULTI_CHOICE"
  | "LINK";

export type FieldValueProps = {
  kind: FieldValueKind;
  /** Already resolved for display: list ids replaced by names, booleans by `yes`/`no`. */
  value: string | readonly string[] | null | undefined;
  /** Shown when the value is empty. */
  empty?: string;
};

/** Read-only display of one stored field value, by the field's kind. */
export function FieldValue({ kind, value, empty = "–" }: FieldValueProps) {
  const list = value === null || value === undefined ? [] : ([] as string[]).concat(value);
  if (list.length === 0 || list.every((entry) => entry === "")) {
    return <span data-slot="field-value">{empty}</span>;
  }
  if (kind === "MULTI_CHOICE") {
    return (
      <span data-slot="field-value" className="flex flex-wrap gap-1">
        {list.map((entry) => (
          <Badge key={entry} variant="secondary">
            {entry}
          </Badge>
        ))}
      </span>
    );
  }
  const isTabular = kind === "NUMBER" || kind === "DATE";
  return (
    <span data-slot="field-value" className={isTabular ? "font-sans tabular-nums" : undefined}>
      {list.join(", ")}
    </span>
  );
}
