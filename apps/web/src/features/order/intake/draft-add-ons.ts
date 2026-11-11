import type { DraftAddOn as AddOnInput, PreviewLine } from "@bibi/core";
import type { DraftAddOn, DraftLine } from "./draft-line";

const date = ({ at }: { at: string | null }) => (at === null ? null : new Date(at));

/** An add-on as `order.create` takes it: no times = the line's period (ADR 0088 decision 8). */
export function toAddOnInput({ addOn }: { addOn: DraftAddOn }): AddOnInput {
  const own = addOn.startsAt !== null && addOn.endsAt !== null;
  return {
    ...{ itemId: addOn.itemId, name: addOn.name, quantity: addOn.quantity },
    unitPriceMinor: addOn.unitPriceMinor,
    ...(own ? { startsAt: date({ at: addOn.startsAt }), endsAt: date({ at: addOn.endsAt }) } : {}),
  };
}

export type AddOnLineInput = { line: DraftLine; addOn: DraftAddOn };

/** An add-on as a line of its own: its time, else its line's (for the snapshot and calendar). */
export function addOnLine({ line, addOn }: AddOnLineInput): DraftLine {
  const own = addOn.startsAt !== null && addOn.endsAt !== null;
  return {
    ...line,
    key: `${line.key}:${addOn.key}`,
    ...{ name: addOn.name, itemId: addOn.itemId, layoutId: null, quantity: addOn.quantity },
    startsAt: own ? addOn.startsAt : line.startsAt,
    endsAt: own ? addOn.endsAt : line.endsAt,
    ...{ unitPriceMinor: addOn.unitPriceMinor, discountPercent: null, note: null },
    ...{ options: [], needs: [], addOns: [] },
  };
}

export type FlattenDraftInput = {
  lines: readonly DraftLine[];
  /** The preview's lines in the same order; null while none is ready. */
  planned: readonly (PreviewLine | null)[] | null;
};

/**
 * Every line followed by its add-ons, each as a line with its planned row (an add-on's preview
 * under its line's), so views that place lines on items show add-ons like any line.
 */
export function flattenDraft({ lines, planned }: FlattenDraftInput) {
  const rows = lines.flatMap((line, index) => {
    const own = planned?.[index] ?? null;
    return [
      { line, planned: own },
      ...line.addOns.map((addOn, at) => {
        const row = own?.addOns[at];
        return {
          line: addOnLine({ line, addOn }),
          planned: row ? { ...row, options: [], addOns: [] } : null,
        };
      }),
    ];
  });
  return {
    lines: rows.map((row) => row.line),
    planned: planned ? rows.map((row): PreviewLine | null => row.planned) : null,
  };
}
