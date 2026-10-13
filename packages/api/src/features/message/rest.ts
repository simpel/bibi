import { restRoute } from "../../rest-route";

export const messageRoutes = [
  restRoute({
    operation: "message.list",
    method: "GET",
    path: "/conversations/{conversationId}/messages",
  }),
  restRoute({
    operation: "message.append",
    method: "POST",
    path: "/conversations/{conversationId}/messages",
  }),
];
