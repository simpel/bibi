import { z } from "zod";

/**
 * JSON ("wire") forms of core output schemas as tool results carry them (dates = ISO strings).
 * Client-safe on purpose: zod only, no `@okazi/core` import (its barrel pulls in Prisma), so the
 * web can import `@okazi/ai/ui` in client components. `test/ui-wire-parity.test.ts` fails when a
 * core schema gains/loses a field that is not mirrored here.
 */
const status = z.enum(["ACTIVE", "ARCHIVED"]);
const audit = { createdAt: z.string(), updatedAt: z.string(), createdBy: z.string().nullable() };

export const VenueWireSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  streetAddress: z.string().nullable(),
  postalCode: z.string().nullable(),
  city: z.string().nullable(),
  country: z.string(),
  contactEmail: z.string().nullable(),
  contactPhone: z.string().nullable(),
  openingHours: z.string().nullable(),
  defaultVatRatePercent: z.number().int(),
  status,
  ...audit,
});

export const RoomWireSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  venueId: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  floor: z.string().nullable(),
  areaSqm: z.number().nullable(),
  ceilingHeightM: z.number().nullable(),
  hasDaylight: z.boolean(),
  maxCapacity: z.number().int().nullable(),
  status,
  ...audit,
});

const page = <T extends z.ZodType>({ item }: { item: T }) =>
  z.object({ items: z.array(item), nextCursor: z.string().nullable() });

export const VenueListWireSchema = page({ item: VenueWireSchema });
export const RoomListWireSchema = page({ item: RoomWireSchema });

const skillScope = z.enum(["SYSTEM", "ORGANIZATION", "PERSONAL"]);
const skillStatus = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);

/** Skill row in tables (skill_list, skill_search): no instructions. */
export const SkillRowSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  description: z.string(),
  scope: skillScope,
  status: skillStatus.optional(),
});

export const SkillListWireSchema = z.object({
  items: z.array(SkillRowSchema),
  nextCursor: z.string().nullable().default(null),
});

/** `skill_search` (local tool) output. */
export const SkillSearchWireSchema = z.object({ skills: z.array(SkillRowSchema) });

/** Skill card: full skills (skill_get/create/...) and `load_skill` output share these fields. */
export const SkillCardWireSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  version: z.number().int(),
  description: z.string().optional(),
  instructions: z.string().optional(),
  status: skillStatus.optional(),
  scope: skillScope.optional(),
  allowedTools: z.array(z.string()).optional(),
  activeTools: z.array(z.string()).optional(),
});

export const SearchHitWireSchema = z.object({
  entityType: z.string(),
  entityId: z.string(),
  score: z.number(),
  content: z.string(),
});

export const SearchWireSchema = z.object({ hits: z.array(SearchHitWireSchema) });

export const McpErrorWireSchema = z.object({ code: z.string(), message: z.string() });

export type VenueWire = z.infer<typeof VenueWireSchema>;
export type RoomWire = z.infer<typeof RoomWireSchema>;
export type SkillRow = z.infer<typeof SkillRowSchema>;
export type SkillCardWire = z.infer<typeof SkillCardWireSchema>;
export type SearchHitWire = z.infer<typeof SearchHitWireSchema>;
