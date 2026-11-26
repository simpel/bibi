import { restRoute } from "../../rest-route";

/** The Archive page (ADR 0118); restore and delete live on each entity's own routes. */
export const archiveRoutes = [
  restRoute({ operation: "archive.list", method: "GET", path: "/archive" }),
];
