import { restRoute } from "../../rest-route";

export const configurationRoutes = [
  restRoute({
    operation: "configuration.importTemplate",
    method: "POST",
    path: "/configuration/import-template",
  }),
];
