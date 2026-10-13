export const ROUTES = {
  home: "/",
  login: "/login",
  signUp: "/sign-up",
  selectOrganization: "/select-organization",
  venues: "/venues",
} as const;

export type VenueRouteInput = { id: string };

export function venueRoute({ id }: VenueRouteInput): string {
  return `${ROUTES.venues}/${encodeURIComponent(id)}`;
}

export type WithNextInput = { path: string; next: string };

/** `/login?next=/venues/x`: carries the post-sign-in target between auth pages. */
export function withNext({ path, next }: WithNextInput): string {
  return `${path}?next=${encodeURIComponent(next)}`;
}
