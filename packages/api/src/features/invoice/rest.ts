import { restRoute } from "../../rest-route";

export const invoiceRoutes = [
  restRoute({ operation: "invoice.list", method: "GET", path: "/tickets/{ticketId}/invoices" }),
  restRoute({ operation: "invoice.create", method: "POST", path: "/invoices" }),
  restRoute({ operation: "invoice.get", method: "GET", path: "/invoices/{id}" }),
  restRoute({ operation: "invoice.send", method: "POST", path: "/invoices/{id}/send" }),
  restRoute({ operation: "invoice.void", method: "POST", path: "/invoices/{id}/void" }),
];
