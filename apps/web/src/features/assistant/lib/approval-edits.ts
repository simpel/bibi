import type { ChangePreview } from "@bibi/core/schemas";

/** A value the user set on the approval card; sent with Confirm and validated by MCP. */
export type EditValue = string | number | boolean;

export type ApprovalEdits = Readonly<Record<string, EditValue>>;

/** How a field is edited: plain text, a number, an amount in minor units or yes/no. */
export type EditKind = "text" | "number" | "money" | "boolean";

type FieldChange = ChangePreview["changes"][number]["fields"][number];

const isReference = ({ path }: { path: string }): boolean =>
  path === "id" || path.endsWith("Id") || path.endsWith("Ids");

function kindOf({ value, path }: { value: unknown; path: string }): EditKind | null {
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "number") return path.endsWith("Minor") ? "money" : "number";
  if (typeof value === "string") return "text";
  return null;
}

export type EditKindInput = {
  preview: ChangePreview;
  field: FieldChange;
};

/**
 * Whether a row of the card can be edited and how. Only a single record's own top-level fields
 * with a plain value; references (ids, names looked up from ids) stay as the assistant proposed.
 */
export function editKind({ preview, field }: EditKindInput): EditKind | null {
  if (preview.changes.length !== 1) return null;
  const { path, after, before } = field;
  if (path.includes(".") || isReference({ path })) return null;
  if (typeof after === "string" && preview.names[after]) return null;
  const value = after ?? before;
  if (value === null || value === undefined) return path.endsWith("Minor") ? "money" : "text";
  return kindOf({ value, path });
}

export type ApplyEditsInput = { preview: ChangePreview; edits: ApprovalEdits };

/** The preview with the user's edits as the new values, so the card shows what will run. */
export function applyEdits({ preview, edits }: ApplyEditsInput): ChangePreview {
  if (Object.keys(edits).length === 0) return preview;
  return {
    ...preview,
    changes: preview.changes.map((change) => ({
      ...change,
      fields: change.fields.map((field) =>
        field.path in edits ? { ...field, after: edits[field.path] } : field,
      ),
    })),
  };
}
