import { restRoute } from "../../rest-route";

const SUBJECT = "/assignments/{subjectType}/{subjectId}";

export const assignmentRoutes = [
  restRoute({ operation: "assignment.listMine", method: "GET", path: "/assignments/mine" }),
  restRoute({ operation: "assignment.list", method: "GET", path: SUBJECT }),
  restRoute({ operation: "assignment.assign", method: "PUT", path: SUBJECT }),
  restRoute({ operation: "assignment.follow", method: "POST", path: `${SUBJECT}/followers` }),
  restRoute({
    operation: "assignment.unfollow",
    method: "DELETE",
    path: `${SUBJECT}/followers/{userId}`,
  }),
];
