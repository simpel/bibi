import { restRoute } from "../../rest-route";

/** The caller's own profile and working hours (ADR 0061); one of each per user, so no id. */
export const profileRoutes = [
  restRoute({ operation: "profile.get", method: "GET", path: "/profile" }),
  restRoute({ operation: "profile.update", method: "PUT", path: "/profile" }),
  restRoute({ operation: "workingHours.get", method: "GET", path: "/working-hours" }),
  restRoute({ operation: "workingHours.set", method: "PUT", path: "/working-hours" }),
];
