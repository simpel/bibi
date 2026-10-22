import type { SkillDto } from "@bibi/core";
import { SkillCreateInputSchema } from "@bibi/core/schemas";
import { blankToUndefined } from "@/lib/blank";
import { formSchema } from "@/lib/form-schema";
import type { SkillScopeChoice } from "./skill-types";

export type SkillResourceValues = { name: string; content: string };

/** Raw values of the skill form: strings, with tools as one text (a name per line or comma). */
export type SkillFormValues = {
  scope: SkillScopeChoice;
  name: string;
  slug: string;
  description: string;
  instructions: string;
  allowedTools: string;
  resources: SkillResourceValues[];
};

export type SkillFormInput = { values: SkillFormValues };

const TOOL_SEPARATOR = /[\s,]+/;

/** "venue_list, item_list\nsearch" → ["venue_list", "item_list", "search"]. */
export function parseToolList({ text }: { text: string }): string[] {
  return text.split(TOOL_SEPARATOR).filter(Boolean);
}

/** Form strings → the shape core's `skill.create` input schema validates. */
export function skillFormToInput({ values }: SkillFormInput) {
  return {
    scope: values.scope,
    slug: blankToUndefined({ value: values.slug }),
    name: values.name.trim(),
    description: values.description.trim(),
    instructions: values.instructions.trim(),
    allowedTools: parseToolList({ text: values.allowedTools }),
    resources: values.resources.filter(({ name, content }) => name.trim() || content.trim()),
  };
}

/** Core's schema is the single source of validation rules for the form. */
export const skillFormSchema = formSchema({
  schema: SkillCreateInputSchema,
  toInput: skillFormToInput,
});

export type SkillDefaultsInput = { skill?: SkillDto | undefined };

export function skillFormDefaults({ skill }: SkillDefaultsInput): SkillFormValues {
  return {
    scope: skill?.scope === "ORGANIZATION" ? "ORGANIZATION" : "PERSONAL",
    name: skill?.name ?? "",
    slug: skill?.slug ?? "",
    description: skill?.description ?? "",
    instructions: skill?.instructions ?? "",
    allowedTools: skill?.allowedTools.join("\n") ?? "",
    resources: skill?.resources ?? [],
  };
}
