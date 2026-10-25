import { restRoute } from "../../rest-route";

/** The caller's own settings, shared across organizations (ADR 0046). */
export const userSettingsRoutes = [
  restRoute({ operation: "userSettings.get", method: "GET", path: "/user-settings" }),
  restRoute({ operation: "userSettings.update", method: "PUT", path: "/user-settings" }),
];
