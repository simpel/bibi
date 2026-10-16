import { restRoute } from "../../rest-route";

export const optionRoutes = [
  restRoute({ operation: "option.list", method: "GET", path: "/options" }),
  restRoute({ operation: "option.get", method: "GET", path: "/options/{id}" }),
  restRoute({ operation: "option.create", method: "POST", path: "/options" }),
  restRoute({ operation: "option.release", method: "POST", path: "/options/{id}/release" }),
  restRoute({ operation: "option.expireDue", method: "POST", path: "/options/expire-due" }),
];
