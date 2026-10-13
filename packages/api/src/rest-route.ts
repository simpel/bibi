export const REST_METHODS = ["GET", "POST", "PATCH", "PUT", "DELETE"] as const;
export type RestMethod = (typeof REST_METHODS)[number];

/** Declared REST metadata for one core operation. Path params use `{name}` syntax. */
export type RestRoute = {
  operation: string;
  method: RestMethod;
  path: string;
  successStatus: number;
  /** Unique OpenAPI operationId; defaults to the operation name in camelCase. */
  operationId?: string;
  /** OpenAPI tag; defaults to the operation name prefix (`venue`). */
  tag?: string;
};

export type RestRouteInput = Omit<RestRoute, "successStatus"> & { successStatus?: number };

/** Declares a route; `successStatus` defaults to 201 for POST and 200 otherwise. */
export function restRoute({ successStatus, ...route }: RestRouteInput): RestRoute {
  return { ...route, successStatus: successStatus ?? (route.method === "POST" ? 201 : 200) };
}
