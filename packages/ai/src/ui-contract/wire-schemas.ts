import {
  EntityTypeSchema,
  FieldDefinitionSchema,
  InvitationSchema,
  ItemSchema,
  MemberSchema,
  RoleSchema,
  SearchHitSchema,
  SetupSchema,
  SkillSchema,
  VenueSchema,
  VocabularySchema,
} from "@okazi/core/schemas";
import { z } from "zod";

/**
 * JSON ("wire") forms of core output schemas as tool results carry them (dates = ISO strings).
 * Derived from `@okazi/core/schemas` (zod only, client-safe: the core barrel pulls in Prisma),
 * so a field added in core flows through here by construction. Only the date fields are
 * overridden; `skill` shapes are projections of `SkillSchema`.
 */
const isoDates = { createdAt: z.string(), updatedAt: z.string() };

export const VenueWireSchema = VenueSchema.extend(isoDates);

export const ItemWireSchema = ItemSchema.extend(isoDates);
export const FieldDefinitionWireSchema = FieldDefinitionSchema.extend(isoDates);
export const EntityTypeWireSchema = EntityTypeSchema.extend({
  ...isoDates,
  fields: z.array(FieldDefinitionWireSchema),
});
export const VocabularyWireSchema = VocabularySchema.extend(isoDates);
export const SetupWireSchema = SetupSchema.extend(isoDates);

export const RoleWireSchema = RoleSchema.extend({
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
});
export const MemberWireSchema = MemberSchema.extend({ createdAt: z.string() });
export const InvitationWireSchema = InvitationSchema.extend({
  createdAt: z.string(),
  expiresAt: z.string(),
});

const page = <T extends z.ZodType>({ item }: { item: T }) =>
  z.object({ items: z.array(item), nextCursor: z.string().nullable() });

export const VenueListWireSchema = page({ item: VenueWireSchema });
export const ItemListWireSchema = page({ item: ItemWireSchema });
export const FieldDefinitionListWireSchema = page({ item: FieldDefinitionWireSchema });
export const EntityTypeListWireSchema = page({ item: EntityTypeWireSchema });
export const VocabularyListWireSchema = page({ item: VocabularyWireSchema });
export const SetupListWireSchema = page({ item: SetupWireSchema });

export const RoleListWireSchema = page({ item: RoleWireSchema });
export const MemberListWireSchema = page({ item: MemberWireSchema });
export const InvitationListWireSchema = page({ item: InvitationWireSchema });
/** `role_importTemplate` output: the roles it created. */
export const RoleImportWireSchema = z.object({
  created: z.array(RoleWireSchema),
  skipped: z.array(z.string()),
});
/** `configuration_importTemplate` output: what the import created, and the names it skipped. */
export const ConfigurationImportWireSchema = z.object({
  created: z.object({
    vocabularies: z.array(VocabularyWireSchema),
    setups: z.array(SetupWireSchema),
    entityTypes: z.array(EntityTypeWireSchema),
  }),
  skipped: z.object({
    vocabularies: z.array(z.string()),
    setups: z.array(z.string()),
    entityTypes: z.array(z.string()),
  }),
});

/** Skill row in tables (skill_list, skill_search): no instructions. */
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
export const SkillCardWireSchema = SkillSchema.pick({
  id: true,
  slug: true,
  name: true,
  version: true,
}).extend({
  description: SkillSchema.shape.description.optional(),
  instructions: SkillSchema.shape.instructions.optional(),
  status: SkillSchema.shape.status.optional(),
  scope: SkillSchema.shape.scope.optional(),
  allowedTools: SkillSchema.shape.allowedTools.optional(),
  activeTools: z.array(z.string()).optional(),
});

export const SearchHitWireSchema = SearchHitSchema;

export const SearchWireSchema = z.object({ hits: z.array(SearchHitWireSchema) });

export const McpErrorWireSchema = z.object({ code: z.string(), message: z.string() });

export type VenueWire = z.infer<typeof VenueWireSchema>;
export type ItemWire = z.infer<typeof ItemWireSchema>;
export type FieldDefinitionWire = z.infer<typeof FieldDefinitionWireSchema>;
export type EntityTypeWire = z.infer<typeof EntityTypeWireSchema>;
export type VocabularyWire = z.infer<typeof VocabularyWireSchema>;
export type SetupWire = z.infer<typeof SetupWireSchema>;
export type RoleWire = z.infer<typeof RoleWireSchema>;
export type MemberWire = z.infer<typeof MemberWireSchema>;
export type InvitationWire = z.infer<typeof InvitationWireSchema>;
export type SkillRow = z.infer<typeof SkillRowSchema>;
export type SkillCardWire = z.infer<typeof SkillCardWireSchema>;
export type SearchHitWire = z.infer<typeof SearchHitWireSchema>;
