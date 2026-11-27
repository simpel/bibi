import { restRoute } from "../../rest-route";

export const integrationRoutes = [
  restRoute({ operation: "integration.list", method: "GET", path: "/integrations" }),
  restRoute({
    operation: "integration.connect",
    method: "POST",
    path: "/integrations/{provider}/connect",
    successStatus: 200,
  }),
  restRoute({
    operation: "integration.syncAccounts",
    method: "POST",
    path: "/integrations/{provider}/sync-accounts",
    successStatus: 200,
  }),
  restRoute({
    operation: "integration.accounts",
    method: "GET",
    path: "/integrations/{provider}/accounts",
  }),
  restRoute({
    operation: "integration.disconnect",
    method: "POST",
    path: "/integrations/{provider}/disconnect",
    successStatus: 200,
  }),
];
