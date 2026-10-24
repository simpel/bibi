import { PipelinePreviewSchema, PipelineSetupDraftSchema } from "@bibi/core/schemas";
import { z } from "zod";
import { StatusGridWireSchema } from "./status-grid-entries";
import type { ToolUiEntry } from "./tool-ui-types";
import { uiEntry } from "./ui-entry";

/** The preview as tool results carry it (it has no dates). */
export type PipelinePreviewWire = z.infer<typeof PipelinePreviewSchema>;

/** A whole setup draft as tool results carry it. */
export type PipelineSetupDraftWire = z.infer<typeof PipelineSetupDraftSchema>;

/** Tool → component for the guided pipeline setup (ADR 0044). */
export const PIPELINE_SETUP_UI_ENTRIES: Readonly<Record<string, ToolUiEntry>> = {
  pipelineSetup_preview: uiEntry({
    component: "pipeline-preview",
    schema: PipelinePreviewSchema,
    toProps: ({ value }) => ({ preview: value }),
  }),
  pipelineSetup_presetDraft: uiEntry({
    component: "pipeline-draft-card",
    schema: PipelineSetupDraftSchema,
    toProps: ({ value }) => ({ draft: value }),
  }),
  // The activated pipeline is shown by its grid; statuses and states have their own tools.
  pipelineSetup_activate: uiEntry({
    component: "status-grid-table",
    schema: z.object({ grid: StatusGridWireSchema }),
    toProps: ({ value }) => value.grid,
  }),
};
