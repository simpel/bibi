import { restRoute } from "../../rest-route";

export const conversationRoutes = [
  restRoute({ operation: "conversation.list", method: "GET", path: "/conversations" }),
  restRoute({ operation: "conversation.create", method: "POST", path: "/conversations" }),
  restRoute({ operation: "conversation.get", method: "GET", path: "/conversations/{id}" }),
  restRoute({ operation: "conversation.rename", method: "PATCH", path: "/conversations/{id}" }),
  restRoute({ operation: "conversation.archive", method: "DELETE", path: "/conversations/{id}" }),
];
