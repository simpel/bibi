import { restRoute } from "../../rest-route";

const BASE = "/pipeline-setup";

export const pipelineSetupRoutes = [
  // A preview takes a whole draft as its body and writes nothing.
  restRoute({
    operation: "pipelineSetup.preview",
    method: "POST",
    path: `${BASE}/preview`,
    successStatus: 200,
  }),
  restRoute({ operation: "pipelineSetup.activate", method: "POST", path: `${BASE}/activate` }),
  restRoute({
    operation: "pipelineSetup.presetDraft",
    method: "GET",
    path: `${BASE}/presets/{key}`,
  }),
];
