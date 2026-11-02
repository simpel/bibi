import { restRoute } from "../../rest-route";

export const ticketDraftRoutes = [
  // A query with a body: the message text stays out of the URL and the access logs (ADR 0084).
  restRoute({
    operation: "ticketDraft.fromMessage",
    method: "POST",
    path: "/ticket-drafts",
    successStatus: 200,
  }),
];
