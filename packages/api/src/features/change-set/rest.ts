import { restRoute } from "../../rest-route";

export const changeSetRoutes = [
  // ADR 0049: several commands as one change, all or nothing.
  restRoute({ operation: "changeSet.apply", method: "POST", path: "/change-sets" }),
];
