import { z } from "zod";

export const ArchiveListInputSchema = z.object({
  kind: z
    .string()
    .optional()
    .describe("Only this kind, by entity type (e.g. `customer`, `task`); omitted = every kind"),
  query: z.string().trim().max(200).optional().describe("Text the record's name contains"),
  limit: z.number().int().min(1).max(500).default(200),
});

/** One archived record on the Archive page (ADR 0118). */
export const ArchivedRecordSchema = z.object({
  kind: z.string().describe("Entity type, e.g. `customer`"),
  label: z.string().describe("The kind as a noun, e.g. `Customer`"),
  id: z.string(),
  name: z.string(),
  archivedAt: z.date().nullable(),
  deletesAt: z
    .date()
    .nullable()
    .describe("When the retention job deletes it: archived at plus the retention days"),
  restoreOperation: z.string().describe("The `<entity>.restore` operation that brings it back"),
  deleteOperation: z.string().describe("The `<entity>.delete` operation that deletes it for good"),
});

export const ArchiveListOutputSchema = z.object({
  items: z.array(ArchivedRecordSchema).describe("Newest archived first"),
  truncated: z.boolean().describe("More records matched than `limit`; narrow with kind or query"),
  retentionDays: z.number().int(),
});

export type ArchiveListInput = z.infer<typeof ArchiveListInputSchema>;
export type ArchivedRecord = z.infer<typeof ArchivedRecordSchema>;
export type ArchiveList = z.infer<typeof ArchiveListOutputSchema>;
