import { z } from "zod";
import type { Err } from "../errors/result";

/** What archiving a phase or state would do, reported without changing anything. */
export const ArchivePreviewSchema = z.object({
  archivable: z
    .boolean()
    .describe("False when blockers would refuse the archive (nothing changes)"),
  moving: z.number().int().describe("Tickets (phase) or lines (state) that move to the target"),
  cells: z.number().int().describe("Phase grid cells cleared or moved with the archive"),
  targetRequired: z.boolean().describe("The archive needs a target because rows use it"),
  blockers: z.array(z.string()).describe("Why the archive would be refused, one per blocker"),
});

export type ArchivePreview = z.infer<typeof ArchivePreviewSchema>;

export type ArchiveCounts = Pick<ArchivePreview, "moving" | "cells">;

/** The blockers of a refused archive: its issue messages, or its message when it has none. */
export function blockersOf({ error }: Pick<Err, "error">): string[] {
  const { issues, message } = error;
  return issues.length > 0 ? issues.map((issue) => issue.message) : [message];
}
