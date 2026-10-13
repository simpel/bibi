import type { PromptSkill } from "../skills/skill-wire";
import { assistantRules } from "./assistant-rules";
import { contextSection, skillsSection } from "./context-sections";
import type { AssistantLocale, PageContext } from "./page-context-schema";
import { PRODUCT_CONTEXT } from "./product-context";

export type BuildSystemPromptInput = {
  organizationId: string;
  locale: AssistantLocale;
  page?: PageContext;
  skills: readonly PromptSkill[];
  now?: Date;
};

/** System instructions for one run: product, rules, context (org/page) and skill catalogue. */
export function buildSystemPrompt({
  organizationId,
  locale,
  page,
  skills,
  now = new Date(),
}: BuildSystemPromptInput): string {
  const rules = assistantRules({ locale }).map((rule) => `- ${rule}`);
  return [
    PRODUCT_CONTEXT,
    ["## Rules", ...rules].join("\n"),
    contextSection({ organizationId, now, ...(page ? { page } : {}) }),
    skillsSection({ skills }),
  ].join("\n\n");
}
