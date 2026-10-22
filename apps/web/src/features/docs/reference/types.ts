import type { JsonObject } from "@bibi/api";

/** One MCP tool, flattened for the public reference page (serializable). */
export type ReferenceEntry = {
  /** Anchor id: the tool name. */
  id: string;
  toolName: string;
  /** Section in the reference, e.g. `venue`. */
  group: string;
  /** Core operation name, e.g. `venue.create` (empty for generic tools). */
  operation: string;
  summary: string;
  permission: string;
  readOnly: boolean;
  /** An AI actor's call becomes a proposal the user must approve. */
  approval: boolean;
  input: JsonObject;
  output: JsonObject;
};
