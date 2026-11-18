import type { WebSurface } from "./web-surfaces";

const PIPELINE = { route: "/pipeline" } as const;

/**
 * The pipeline board (ADR 0041, 0043) and its boards and columns (ADR 0067): the switcher, and
 * customize mode (`?mode=customize`) for renaming, adding, reordering and archiving.
 */
export const PIPELINE_SURFACES: readonly WebSurface[] = [
  { operation: "pipeline.board", ...PIPELINE },
  // The order table's card cues (spec: boards).
  { operation: "pipeline.cues", route: "/orders" },
  // The Workload dashboard (ADR 0086).
  { operation: "dashboard.summary", route: "/data/[dashboard]/[from]/[to]" },
  { operation: "board.list", ...PIPELINE },
  { operation: "orderStatus.setGates", route: "/admin/pipeline" },
  { operation: "board.get", ...PIPELINE },
  { operation: "board.create", ...PIPELINE },
  { operation: "board.update", ...PIPELINE },
  { operation: "board.share", ...PIPELINE },
  { operation: "board.archive", ...PIPELINE },
  { operation: "boardPhase.create", ...PIPELINE },
  { operation: "boardPhase.update", ...PIPELINE },
  { operation: "boardPhase.archive", ...PIPELINE },
  { operation: "boardPhase.reorder", ...PIPELINE },
  { operation: "boardPhase.moveStatus", ...PIPELINE },
];
