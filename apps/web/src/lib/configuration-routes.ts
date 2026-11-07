import { ROUTES } from "./routes";

export type IdRouteInput = { id: string };

/** `/items/<id>`: item detail page. */
export function itemRoute({ id }: IdRouteInput): string {
  return `${ROUTES.items}/${encodeURIComponent(id)}`;
}

/** `/admin/types/<id>`: type detail page (capabilities and fields). */
export function entityTypeRoute({ id }: IdRouteInput): string {
  return `${ROUTES.adminTypes}/${encodeURIComponent(id)}`;
}

/** `/admin/lists/<id>`: list detail page (values). */
export function vocabularyRoute({ id }: IdRouteInput): string {
  return `${ROUTES.adminLists}/${encodeURIComponent(id)}`;
}

/** `/admin/setups`: the organization's setups (no detail page). */
export function setupsRoute(): string {
  return ROUTES.adminSetups;
}

/** `/admin/responsibilities`: the organization's responsibilities (no detail page). */
export function responsibilitiesRoute(): string {
  return ROUTES.adminResponsibilities;
}

/** `/admin/run-sheets`: the organization's run sheet definitions (no detail page). */
export function runSheetDefinitionsRoute(): string {
  return ROUTES.adminRunSheets;
}

/** `/admin/price-lists`: the organization's price lists (no detail page). */
export function priceListsRoute(): string {
  return ROUTES.adminPriceLists;
}

/** `/admin/pipeline`: the organization's order statuses (no detail page). */
export function orderStatusesRoute(): string {
  return ROUTES.adminPipeline;
}
