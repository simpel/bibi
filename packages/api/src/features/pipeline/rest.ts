import { restRoute } from "../../rest-route";

export const pipelineRoutes = [
  restRoute({ operation: "pipeline.board", method: "GET", path: "/pipeline" }),
  restRoute({ operation: "pipeline.cues", method: "GET", path: "/pipeline/cues" }),
];
