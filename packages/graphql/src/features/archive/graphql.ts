import {
  type ArchivedRecord,
  ArchivedRecordSchema,
  type ArchiveList,
  ArchiveListOutputSchema,
  listArchived,
} from "@bibi/core";
import { builder } from "../../schema/builder";
import { fieldFromOperation } from "../../schema/from-operation";
import { objectFromSchema } from "../../schema/object-from-schema";

const ArchivedRecordRef = objectFromSchema<ArchivedRecord>({
  name: "ArchivedRecord",
  schema: ArchivedRecordSchema,
  description:
    "An archived record with its own page, with when it will be deleted and how to restore it.",
});
const ArchiveListRef = objectFromSchema<ArchiveList>({
  name: "ArchiveList",
  schema: ArchiveListOutputSchema,
  omit: ["items"],
  description: "The Archive page (ADR 0118): archived records the caller may restore or delete.",
});
builder.objectField(ArchiveListRef, "items", (t) =>
  t.field({ type: [ArchivedRecordRef], resolve: (list) => list.items }),
);
fieldFromOperation({ operation: listArchived, type: ArchiveListRef, name: "archivedRecords" });
