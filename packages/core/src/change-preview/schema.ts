import { z } from "zod";
import { FEATURE_GROUPS } from "../permissions/features";

/** A JSON value as stored on a record (before or after a change). */
// Optional: JSON drops `undefined`, so a field that did not exist arrives without the key.
const ValueSchema = z.unknown().optional().describe("The value; absent when it did not exist");

/** One changed field, by path (`priceMinor`, `fields.seats`, `setups.<setupId>.capacity`). */
export const FieldChangeSchema = z.object({
  path: z.string().describe("Dot path of the field; array entries are keyed by their id"),
  before: ValueSchema,
  after: ValueSchema,
});

export const CHANGE_KINDS = ["create", "update", "archive"] as const;

/** One record a command would create, change or archive. */
export const RecordChangePreviewSchema = z.object({
  entityType: z.string().describe("Kind of record, e.g. item or ticketStatus"),
  entityId: z.string(),
  kind: z.enum(CHANGE_KINDS),
  name: z.string().nullable().describe("The record's name, when it has one"),
  fields: z.array(FieldChangeSchema),
});

export const CONSEQUENCE_SEVERITIES = ["info", "warning"] as const;

/** What a change affects beyond its own fields, as an i18n key with values (ADR 0049). */
export const ConsequenceSchema = z.object({
  key: z.string().describe("Message key under `assistant.approval.consequences`"),
  values: z.record(z.string(), z.union([z.string(), z.number()])),
  severity: z.enum(CONSEQUENCE_SEVERITIES),
});

/**
 * What a command would do, computed by running it in a transaction that is rolled back: the
 * records and fields it changes, the names of ids it mentions, and its consequences.
 */
export const ChangePreviewSchema = z.object({
  group: z
    .enum([...FEATURE_GROUPS, "self"])
    .describe("Feature group of the change (ADR 0050); self = the caller's own space"),
  changes: z.array(RecordChangePreviewSchema),
  names: z.record(z.string(), z.string()).describe("Names of the ids in paths and values"),
  consequences: z.array(ConsequenceSchema),
});

export type FieldChange = z.infer<typeof FieldChangeSchema>;
export type RecordChangePreview = z.infer<typeof RecordChangePreviewSchema>;
export type Consequence = z.infer<typeof ConsequenceSchema>;
export type ChangePreview = z.infer<typeof ChangePreviewSchema>;
