import { restRoute } from "../../rest-route";

/** The caller's own preferences (ADR 0039; `key` is part of the path) and settings (ADR 0046). */
export const userPreferenceRoutes = [
  restRoute({ operation: "userPreference.list", method: "GET", path: "/user-preferences" }),
  restRoute({ operation: "userPreference.set", method: "PUT", path: "/user-preferences/{key}" }),
  restRoute({ operation: "userSettings.get", method: "GET", path: "/user-settings" }),
  restRoute({ operation: "userSettings.update", method: "PUT", path: "/user-settings" }),
];
