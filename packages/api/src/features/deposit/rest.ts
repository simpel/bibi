import { restRoute } from "../../rest-route";

export const depositRoutes = [
  restRoute({ operation: "deposit.list", method: "GET", path: "/tickets/{ticketId}/deposits" }),
  restRoute({ operation: "deposit.create", method: "POST", path: "/deposits" }),
  restRoute({ operation: "deposit.get", method: "GET", path: "/deposits/{id}" }),
  restRoute({ operation: "deposit.send", method: "POST", path: "/deposits/{id}/send" }),
  restRoute({ operation: "deposit.void", method: "POST", path: "/deposits/{id}/void" }),
];
