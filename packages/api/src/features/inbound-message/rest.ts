import { restRoute } from "../../rest-route";
import { inboundEmailRoutes } from "../inbound-email/rest";

export const inboundMessageRoutes = [
  restRoute({ operation: "inboundMessage.list", method: "GET", path: "/inbound-messages" }),
  restRoute({
    operation: "inboundMessage.openCount",
    method: "GET",
    path: "/inbound-messages/open-count",
  }),
  restRoute({ operation: "inboundMessage.get", method: "GET", path: "/inbound-messages/{id}" }),
  restRoute({ operation: "inboundMessage.submit", method: "POST", path: "/inbound-messages" }),
  restRoute({
    operation: "inboundMessage.attachToTicket",
    method: "POST",
    path: "/inbound-messages/{id}/attach",
  }),
  restRoute({
    operation: "inboundMessage.markRead",
    method: "POST",
    path: "/inbound-messages/{id}/read",
  }),
  restRoute({
    operation: "inboundMessage.markUnread",
    method: "POST",
    path: "/inbound-messages/{id}/unread",
  }),
  restRoute({
    operation: "inboundMessage.delete",
    method: "DELETE",
    path: "/inbound-messages/{id}",
  }),
  restRoute({ operation: "inboundEndpoint.list", method: "GET", path: "/inbound-endpoints" }),
  // The deprecated `inboundEmail.*` aliases (ADR 0085).
  ...inboundEmailRoutes,
];
