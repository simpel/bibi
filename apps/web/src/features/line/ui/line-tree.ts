import type { LineDto } from "@bibi/core";

/** Where a row sits in its parent's group (ADR 0059, 0088): drawn as a tree in the program. */
export type LineTreePlace = "parent" | "child" | "lastChild" | null;

/**
 * Each line's place: a top-level line with sub-lines is a parent, a part, option or add-on line
 * is a child, the last of its parent's children (in the table's order) its last child.
 */
export function lineTreePlaces({ lines }: { lines: readonly LineDto[] }) {
  const places = new Map<string, LineTreePlace>();
  const lastChild = new Map<string, string>();
  for (const line of lines) {
    if (line.parentLineId) lastChild.set(line.parentLineId, line.id);
  }
  for (const line of lines) {
    if (line.parentLineId) {
      places.set(line.id, lastChild.get(line.parentLineId) === line.id ? "lastChild" : "child");
    } else if (lastChild.has(line.id)) {
      places.set(line.id, "parent");
    }
  }
  return places;
}

/**
 * A parent and its children read as one block: no divider inside it and the children tinted;
 * each child's name starts with an arrow (`program-name-column.tsx`).
 */
export const LINE_TREE_ROW_CLASS: Record<NonNullable<LineTreePlace>, string> = {
  parent: "border-b-0",
  child: "border-b-0 bg-muted/30",
  lastChild: "bg-muted/30",
};
