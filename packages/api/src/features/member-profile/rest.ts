import { restRoute } from "../../rest-route";

/** One profile per member (ADR 0068), nested under the member. */
export const memberProfileRoutes = [
  restRoute({ operation: "memberProfile.list", method: "GET", path: "/member-profiles" }),
  restRoute({ operation: "memberProfile.get", method: "GET", path: "/members/{memberId}/profile" }),
  restRoute({
    operation: "memberProfile.update",
    method: "PATCH",
    path: "/members/{memberId}/profile",
  }),
  restRoute({
    operation: "memberProfile.setItems",
    method: "PUT",
    path: "/members/{memberId}/profile/items",
  }),
];
