import { restRoute } from "../../rest-route";

/** The organization's one profile (ADR 0061), so no id in the path. */
export const organizationProfileRoutes = [
  restRoute({ operation: "organizationProfile.get", method: "GET", path: "/organization-profile" }),
  restRoute({
    operation: "organizationProfile.update",
    method: "PATCH",
    path: "/organization-profile",
  }),
  restRoute({
    operation: "organizationProfile.setSetupStatus",
    method: "PUT",
    path: "/organization-profile/setup-status",
  }),
];
