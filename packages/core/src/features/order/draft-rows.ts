import type { OperationContext } from "../../operations/types";
import type { DraftAddOn } from "./draft-add-on-schema";
import type { PreviewDraftLine } from "./draft-line-schema";
import type { PlannedLine } from "./plan/planned-line";

/** Where a planned row of a draft sits: a line, or one of its add-ons (ADR 0088). */
export type DraftSlot = { lineIndex: number; addOnIndex: number | null };

/** One row a draft is planned and checked as: the line or add-on as `line.create` would see it. */
export type DraftRow = { line: PlannedLine; slot: DraftSlot; path: string };

/** `lines.<i>` for a line, `lines.<i>.addOns.<j>` for an add-on. */
export const slotPath = ({ lineIndex, addOnIndex }: DraftSlot) =>
  addOnIndex === null ? `lines.${lineIndex}` : `lines.${lineIndex}.addOns.${addOnIndex}`;

type AddOnLineInput = {
  parent: PreviewDraftLine;
  addOn: DraftAddOn;
  /** Item id → name, for an add-on without its own name (an empty name when unknown). */
  itemNames: ReadonlyMap<string, string>;
};

/**
 * An add-on as `line.create` with `parentLineId` would insert it (ADR 0088 decisions 6, 8, 11):
 * the parent's type and period unless given, the item's name unless named, its own quantity
 * else the parent's.
 */
export function addOnLine({ parent, addOn, itemNames }: AddOnLineInput): PlannedLine {
  const own = addOn.startsAt !== undefined || addOn.endsAt !== undefined;
  const fromItem = addOn.itemId ? itemNames.get(addOn.itemId) : undefined;
  return {
    entityTypeId: addOn.entityTypeId ?? parent.entityTypeId,
    name: addOn.name ?? fromItem ?? "",
    itemId: addOn.itemId ?? null,
    startsAt: own ? (addOn.startsAt ?? null) : (parent.startsAt ?? null),
    endsAt: own ? (addOn.endsAt ?? null) : (parent.endsAt ?? null),
    quantity: addOn.quantity ?? null,
    unitPriceMinor: addOn.unitPriceMinor ?? null,
    discountPercent: addOn.discountPercent ?? null,
    parent: { quantity: parent.quantity ?? null },
  };
}

export type DraftRowsInput = {
  lines: readonly PreviewDraftLine[];
  itemNames: ReadonlyMap<string, string>;
};

/**
 * The draft as rows to plan: every line first, in order (so a line's index is its row index),
 * then every add-on after them, by line and then by add-on.
 */
export function draftRows({ lines, itemNames }: DraftRowsInput): DraftRow[] {
  const top = lines.map(
    (line, lineIndex): DraftRow => ({
      line,
      slot: { lineIndex, addOnIndex: null },
      path: slotPath({ lineIndex, addOnIndex: null }),
    }),
  );
  const addOns = lines.flatMap((parent, lineIndex) =>
    (parent.addOns ?? []).map((addOn, addOnIndex): DraftRow => {
      const slot = { lineIndex, addOnIndex };
      return { line: addOnLine({ parent, addOn, itemNames }), slot, path: slotPath(slot) };
    }),
  );
  return [...top, ...addOns];
}

export type LoadItemNamesInput = {
  context: Pick<OperationContext, "db">;
  lines: readonly PreviewDraftLine[];
};

/** The names of the items of add-ons without a name of their own: one query. */
export async function loadAddOnItemNames({ context, lines }: LoadItemNamesInput) {
  const ids = lines.flatMap((line) =>
    (line.addOns ?? []).flatMap((addOn) => (addOn.itemId && !addOn.name ? [addOn.itemId] : [])),
  );
  if (ids.length === 0) return new Map<string, string>();
  const rows = await context.db.item.findMany({
    where: { id: { in: [...new Set(ids)] } },
    select: { id: true, name: true },
  });
  return new Map(rows.map((row) => [row.id, row.name]));
}
