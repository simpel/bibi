import { itemRoute } from "@/lib/routes";

/** The floor plan tab's segment; every other tab is a setup id. */
export const PLAN_TAB = "plan";

export type LayoutsRouteInput = { itemId: string; tab?: string };

/** `/items/{id}/layouts[/{tab}]`: the layout editor, opening on a setup or the floor plan. */
export function layoutsRoute({ itemId, tab }: LayoutsRouteInput): string {
  const base = `${itemRoute({ id: itemId })}/layouts`;
  return tab ? `${base}/${encodeURIComponent(tab)}` : base;
}
