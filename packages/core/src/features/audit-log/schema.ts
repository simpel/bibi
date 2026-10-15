import { z } from "zod";
import { PageInputShape } from "../../shared/page-input";

export const AUDIT_ACTOR_TYPES = ["USER", "AI", "SYSTEM"] as const;

export const AuditActorTypeSchema = z.enum(AUDIT_ACTOR_TYPES);

/** One AuditLog row (ADR 0006): who changed which entity, how, and the before/after image. */
export const AuditLogSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  actorType: AuditActorTypeSchema,
  actorId: z.string().nullable(),
  /** Name of the acting member; null for system jobs and users no longer in the org. */
  actorName: z.string().nullable(),
  conversationId: z.string().nullable(),
  /** User who approved an AI-proposed command (human-in-the-loop); null otherwise. */
  approvedBy: z.string().nullable(),
  approvedByName: z.string().nullable(),
  operation: z.string(),
  entityType: z.string().nullable(),
  entityId: z.string().nullable(),
  before: z.unknown().nullable(),
  after: z.unknown().nullable(),
  requestId: z.string().nullable(),
  surface: z.string().nullable(),
  createdAt: z.date(),
});

const optionalId = z.string().trim().min(1).max(200).optional();
const instant = z.iso.datetime({ offset: true }).optional();

export const AuditLogListInputSchema = z.object({
  ...PageInputShape,
  entityType: optionalId.describe("Entity type, e.g. venue or item"),
  entityId: optionalId.describe("Only changes to this entity (use with entityType)"),
  actorType: AuditActorTypeSchema.optional().describe("USER, AI or SYSTEM"),
  actorId: optionalId.describe("Only changes made by this user id"),
  conversationId: optionalId.describe("Only changes proposed in this assistant conversation"),
  requestId: optionalId.describe("Only changes from this request (links to the system log)"),
  from: instant.describe("ISO 8601 timestamp; changes at or after it"),
  to: instant.describe("ISO 8601 timestamp; changes at or before it"),
});

export const AuditLogListOutputSchema = z.object({
  items: z.array(AuditLogSchema),
  nextCursor: z.string().nullable(),
});

export const AuditLogIdInputSchema = z.object({ id: z.string().min(1) });

export type AuditLogDto = z.infer<typeof AuditLogSchema>;
export type AuditLogListInput = z.infer<typeof AuditLogListInputSchema>;
export type AuditLogPage = z.infer<typeof AuditLogListOutputSchema>;
