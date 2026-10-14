import { restRoute } from "../../rest-route";

export const memberRoutes = [
  restRoute({ operation: "member.list", method: "GET", path: "/members" }),
  restRoute({ operation: "member.assignRole", method: "PUT", path: "/members/{id}/roles" }),
  restRoute({ operation: "member.remove", method: "DELETE", path: "/members/{id}" }),
  restRoute({ operation: "member.listInvitations", method: "GET", path: "/invitations" }),
  restRoute({ operation: "member.invite", method: "POST", path: "/invitations" }),
  restRoute({ operation: "member.cancelInvitation", method: "DELETE", path: "/invitations/{id}" }),
];
