import { restRoute } from "../../rest-route";

export const memberRoutes = [
  restRoute({ operation: "member.list", method: "GET", path: "/members" }),
  restRoute({ operation: "member.assignRole", method: "PUT", path: "/members/{id}/roles" }),
];
