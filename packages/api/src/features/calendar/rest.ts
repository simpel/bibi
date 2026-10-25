import { restRoute } from "../../rest-route";

export const calendarRoutes = [
  restRoute({ operation: "calendar.range", method: "GET", path: "/calendar" }),
];
