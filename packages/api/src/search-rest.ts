import { restRoute } from "./rest-route";

export const searchRoutes = [restRoute({ operation: "search", method: "GET", path: "/search" })];
