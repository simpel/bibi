import { SkillImportInputSchema } from "@bibi/core/schemas";
import { formSchema } from "@/lib/form-schema";
import type { SkillScopeChoice } from "./skill-types";

/** Raw values of the import dialog: the SKILL.md text and where the draft should live. */
export type SkillImportValues = { markdown: string; scope: SkillScopeChoice };

export type SkillImportInput = { markdown: string; scope: SkillScopeChoice };

/** Core's schema validates the import form; the values already have its shape. */
export const skillImportSchema = formSchema({
  schema: SkillImportInputSchema,
  toInput: ({ values }: { values: SkillImportValues }) => ({
    markdown: values.markdown,
    scope: values.scope,
  }),
});

export const skillImportDefaults: SkillImportValues = { markdown: "", scope: "PERSONAL" };
