import { itemRoute } from "@/lib/routes";

/** The old floor plan tab's segment (`/layouts/plan`); it now redirects to the floor plan page. */
export const PLAN_TAB = "plan";

/** `/items/{id}/floor-plan`: the room's walls, doors, windows and fixed parts (ADR 0102). */
export const floorPlanRoute = ({ itemId }: { itemId: string }) =>
  `${itemRoute({ id: itemId })}/floor-plan`;

export type LayoutsRouteInput = { itemId: string; layoutId?: string };

/** `/items/{id}/layouts[/{layoutId}]`: one layout of the item, or the first one. */
export function layoutsRoute({ itemId, layoutId }: LayoutsRouteInput): string {
  const base = `${itemRoute({ id: itemId })}/layouts`;
  return layoutId ? `${base}/${encodeURIComponent(layoutId)}` : base;
}
