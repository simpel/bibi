import { restRoute } from "../../rest-route";

export const creditNoteRoutes = [
  restRoute({ operation: "creditNote.list", method: "GET", path: "/credit-notes" }),
  restRoute({ operation: "creditNote.get", method: "GET", path: "/credit-notes/{id}" }),
];
