import { type ArchivePreview, ArchivePreviewSchema } from "@bibi/core/schemas";
import { objectFromSchema } from "./object-from-schema";

export const ArchivePreviewRef = objectFromSchema<ArchivePreview>({
  name: "ArchivePreview",
  schema: ArchivePreviewSchema,
  description:
    "What archiving a ticket status or item state would do, without changing anything: rows that " +
    "move to the target, grid cells affected and the blockers that would refuse it.",
});
