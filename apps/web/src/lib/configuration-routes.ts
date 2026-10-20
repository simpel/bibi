import { ROUTES } from "./routes";

export type IdRouteInput = { id: string };

/** `/items/<id>`: item detail page. */
export function itemRoute({ id }: IdRouteInput): string {
  return `${ROUTES.items}/${encodeURIComponent(id)}`;
}

/** `/settings/types/<id>`: type detail page (capabilities and fields). */
export function entityTypeRoute({ id }: IdRouteInput): string {
  return `${ROUTES.settingsTypes}/${encodeURIComponent(id)}`;
}

/** `/settings/lists/<id>`: list detail page (values). */
export function vocabularyRoute({ id }: IdRouteInput): string {
  return `${ROUTES.settingsLists}/${encodeURIComponent(id)}`;
}

/** `/settings/setups`: the organization's setups (no detail page). */
export function setupsRoute(): string {
  return ROUTES.settingsSetups;
}

/** `/settings/responsibilities`: the organization's responsibilities (no detail page). */
export function responsibilitiesRoute(): string {
  return ROUTES.settingsResponsibilities;
}

/** `/settings/sheets`: the organization's sheet definitions (no detail page). */
export function sheetDefinitionsRoute(): string {
  return ROUTES.settingsSheets;
}

/** `/settings/price-lists`: the organization's price lists (no detail page). */
export function priceListsRoute(): string {
  return ROUTES.settingsPriceLists;
}

/** `/settings/pipeline`: the organization's ticket phases (no detail page). */
export function ticketPhasesRoute(): string {
  return ROUTES.settingsPipeline;
}
