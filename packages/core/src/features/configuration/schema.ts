import { z } from "zod";
import { CONFIGURATION_TEMPLATE_KEYS } from "../../templates/configuration/configuration-templates";
import { EntityTypeSchema } from "../entity-type/schema";
import { ResponsibilitySchema } from "../responsibility/schema";
import { SetupSchema } from "../setup/schema";
import { VocabularySchema } from "../vocabulary/schema";

export const ConfigurationImportTemplateInputSchema = z.object({
  template: z
    .enum(CONFIGURATION_TEMPLATE_KEYS)
    .describe(
      "conference-venue: lists (allergens, diet, severity, accessibility), room setups and " +
        "types such as Conference room, Dish, Meal, Package, Company and Conference, and example " +
        "responsibilities Sales, Coordinator and Head of kitchen",
    ),
});

const NamesSchema = z.array(z.string());

export const ConfigurationImportTemplateOutputSchema = z.object({
  /** What this import created. Everything is ordinary configuration, editable afterwards. */
  created: z.object({
    vocabularies: z.array(VocabularySchema),
    setups: z.array(SetupSchema),
    entityTypes: z.array(EntityTypeSchema),
    responsibilities: z.array(ResponsibilitySchema),
  }),
  /** Names that already existed and were left untouched (a type keeps its own fields). */
  skipped: z.object({
    vocabularies: NamesSchema,
    setups: NamesSchema,
    entityTypes: NamesSchema,
    responsibilities: NamesSchema,
  }),
});

export type ConfigurationImportTemplateInput = z.infer<
  typeof ConfigurationImportTemplateInputSchema
>;
export type ConfigurationImportResult = z.infer<typeof ConfigurationImportTemplateOutputSchema>;
