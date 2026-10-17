import { restRoute } from "../../rest-route";

/** The caller's own preferences (ADR 0039); `key` is part of the path. */
export const userPreferenceRoutes = [
  restRoute({ operation: "userPreference.list", method: "GET", path: "/user-preferences" }),
  restRoute({ operation: "userPreference.set", method: "PUT", path: "/user-preferences/{key}" }),
];
