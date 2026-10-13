import { restRoute } from "../../rest-route";

export const skillRoutes = [
  restRoute({ operation: "skill.list", method: "GET", path: "/skills" }),
  restRoute({ operation: "skill.create", method: "POST", path: "/skills" }),
  restRoute({ operation: "skill.import", method: "POST", path: "/skills/import" }),
  restRoute({ operation: "skill.get", method: "GET", path: "/skills/{id}" }),
  restRoute({ operation: "skill.update", method: "PATCH", path: "/skills/{id}" }),
  restRoute({ operation: "skill.archive", method: "DELETE", path: "/skills/{id}" }),
  restRoute({
    operation: "skill.publish",
    method: "POST",
    path: "/skills/{id}/publish",
    successStatus: 200,
  }),
  restRoute({ operation: "skill.share", method: "POST", path: "/skills/{id}/share" }),
  restRoute({ operation: "skill.export", method: "GET", path: "/skills/{id}/export" }),
];
