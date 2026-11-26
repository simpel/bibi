import { z } from "zod";

/** The id of a record to restore or delete (ADR 0118). */
export const ArchivedRecordIdInputSchema = z.object({ id: z.string().min(1) });

/** What `<entity>.delete` returns: the id of the record that no longer exists (ADR 0118). */
export const DeletedRecordSchema = z.object({
  id: z.string().describe("The deleted record's id; it can no longer be read or restored"),
});

/** One record the retention job deletes (ADR 0118). */
export const ExpiredArchiveSchema = z.object({
  operation: z.string().describe("The `<entity>.delete` operation that deletes it"),
  id: z.string(),
});

export const ArchiveListExpiredInputSchema = z.object({});

export const ArchiveListExpiredOutputSchema = z.object({
  items: z.array(ExpiredArchiveSchema).describe("Archived longer than the retention, by kind"),
});

export type DeletedRecord = z.infer<typeof DeletedRecordSchema>;
export type ExpiredArchive = z.infer<typeof ExpiredArchiveSchema>;
