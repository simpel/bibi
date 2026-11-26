import { type DeletedRecord, DeletedRecordSchema } from "@bibi/core/schemas";
import { objectFromSchema } from "./object-from-schema";

/** What every `<entity>.delete` returns (ADR 0118). */
export const DeletedRecordRef = objectFromSchema<DeletedRecord>({
  name: "DeletedRecord",
  schema: DeletedRecordSchema,
  description:
    "The id of a record that was deleted permanently; it can no longer be read or restored.",
});
