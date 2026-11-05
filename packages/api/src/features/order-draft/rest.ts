import { restRoute } from "../../rest-route";

export const orderDraftRoutes = [
  // A query with a body: the message text stays out of the URL and the access logs (ADR 0084).
  restRoute({
    operation: "orderDraft.fromMessage",
    method: "POST",
    path: "/order-drafts",
    successStatus: 200,
  }),
];
