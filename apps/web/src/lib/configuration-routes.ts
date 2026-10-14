import { ROUTES } from "./routes";

export type IdRouteInput = { id: string };

/** `/items/<id>`: item detail page. */
export function itemRoute({ id }: IdRouteInput): string {
  return `${ROUTES.items}/${encodeURIComponent(id)}`;
}

/** `/settings/types/<id>`: type detail page (behaviours and fields). */
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
