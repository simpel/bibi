import { type ArchivePreview, ArchivePreviewSchema } from "@bibi/core/schemas";
import { uiEntry } from "./ui-entry";

/** The preview of archiving a phase or state as tool results carry it (it has no dates). */
export type ArchivePreviewWire = ArchivePreview;

/** Shared by `ticketPhase_archivePreview` and `itemState_archivePreview`. */
export const archivePreviewEntry = uiEntry({
  component: "archive-preview-card",
  schema: ArchivePreviewSchema,
  toProps: ({ value }) => ({ preview: value }),
});
