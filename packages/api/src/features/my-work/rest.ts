import { restRoute } from "../../rest-route";

export const myWorkRoutes = [
  restRoute({ operation: "myWork.view", method: "GET", path: "/my-work" }),
  restRoute({ operation: "myWork.tasks", method: "GET", path: "/my-work/tasks" }),
  restRoute({ operation: "myWork.dismissTask", method: "POST", path: "/my-work/tasks/dismiss" }),
];
