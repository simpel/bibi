import { restRoute } from "../../rest-route";

export const myWorkRoutes = [
  restRoute({ operation: "myWork.view", method: "GET", path: "/my-work" }),
];
