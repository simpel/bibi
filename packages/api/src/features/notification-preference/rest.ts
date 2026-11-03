import { restRoute } from "../../rest-route";

/** The caller's choice of notification kinds (ADR 0094; `kind` is part of the path). */
export const notificationPreferenceRoutes = [
  restRoute({
    operation: "notificationPreference.list",
    method: "GET",
    path: "/notification-preferences",
  }),
  restRoute({
    operation: "notificationPreference.set",
    method: "PUT",
    path: "/notification-preferences/{kind}",
  }),
];
