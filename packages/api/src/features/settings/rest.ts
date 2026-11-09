import { restRoute } from "../../rest-route";

export const settingsRoutes = [
  restRoute({ operation: "settings.view", method: "GET", path: "/settings" }),
];
