import { restRoute } from "../../rest-route";

export const oauthGrantRoutes = [
  restRoute({ operation: "oauthGrant.list", method: "GET", path: "/oauth-grants" }),
  restRoute({
    operation: "oauthGrant.revoke",
    method: "DELETE",
    path: "/oauth-grants/{clientId}",
  }),
];
