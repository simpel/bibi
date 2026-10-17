import { restRoute } from "../../rest-route";

export const inquiryRoutes = [
  restRoute({ operation: "inquiry.list", method: "GET", path: "/inquiries" }),
  restRoute({ operation: "inquiry.get", method: "GET", path: "/inquiries/{id}" }),
  restRoute({ operation: "inquiry.create", method: "POST", path: "/inquiries" }),
  restRoute({ operation: "inquiry.update", method: "PATCH", path: "/inquiries/{id}" }),
  restRoute({ operation: "inquiry.qualify", method: "POST", path: "/inquiries/{id}/qualify" }),
  restRoute({ operation: "inquiry.markLost", method: "POST", path: "/inquiries/{id}/lost" }),
];
