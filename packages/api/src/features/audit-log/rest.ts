import { restRoute } from "../../rest-route";

export const auditLogRoutes = [
  restRoute({ operation: "auditLog.list", method: "GET", path: "/audit-logs" }),
  restRoute({ operation: "auditLog.get", method: "GET", path: "/audit-logs/{id}" }),
];
