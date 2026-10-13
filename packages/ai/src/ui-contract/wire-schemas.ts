import { RoomSchema, SearchHitSchema, SkillSchema, VenueSchema } from "@okazi/core";
import { z } from "zod";

/**
 * JSON ("wire") forms of core output schemas: tool results are JSON, so dates arrive as ISO
 * strings. Derived from the core schemas so a new field shows up here automatically.
 */
const timestamps = { createdAt: z.string(), updatedAt: z.string() };

export const VenueWireSchema = VenueSchema.extend(timestamps);
export const RoomWireSchema = RoomSchema.extend(timestamps);

const page = <T extends z.ZodType>({ item }: { item: T }) =>
  z.object({ items: z.array(item), nextCursor: z.string().nullable() });

export const VenueListWireSchema = page({ item: VenueWireSchema });
export const RoomListWireSchema = page({ item: RoomWireSchema });

/** Skill row in tables (list, skill_search): no instructions. */
export const SkillRowSchema = SkillSchema.pick({
  id: true,
  slug: true,
  name: true,
  description: true,
  scope: true,
}).extend({ status: SkillSchema.shape.status.optional() });

export const SkillListWireSchema = z.object({
  items: z.array(SkillRowSchema),
  nextCursor: z.string().nullable().default(null),
});

/** `skill_search` (local tool) output. */
export const SkillSearchWireSchema = z.object({ skills: z.array(SkillRowSchema) });

/** Skill card: full skills (skill_get/create/...) and `load_skill` output share these fields. */
export const SkillCardWireSchema = SkillSchema.pick({ id: true, slug: true, name: true, version: true })
  .extend({
    description: z.string().optional(),
    instructions: z.string().optional(),
    status: SkillSchema.shape.status.optional(),
    scope: SkillSchema.shape.scope.optional(),
    allowedTools: z.array(z.string()).optional(),
    activeTools: z.array(z.string()).optional(),
  });

export const SearchWireSchema = z.object({ hits: z.array(SearchHitSchema) });

export const McpErrorWireSchema = z.object({ code: z.string(), message: z.string() });

export type VenueWire = z.infer<typeof VenueWireSchema>;
export type RoomWire = z.infer<typeof RoomWireSchema>;
export type SkillRow = z.infer<typeof SkillRowSchema>;
export type SkillCardWire = z.infer<typeof SkillCardWireSchema>;
export type SearchHitWire = z.infer<typeof SearchHitSchema>;
