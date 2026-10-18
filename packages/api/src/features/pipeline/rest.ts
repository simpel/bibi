import { restRoute } from "../../rest-route";

export const pipelineRoutes = [
  restRoute({ operation: "pipeline.board", method: "GET", path: "/pipeline" }),
];
