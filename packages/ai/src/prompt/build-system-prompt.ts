import type { PermissionSet } from "@bibi/core";
import type { PromptSkill } from "../skills/skill-wire";
import { accessSection } from "./access-section";
import { assistantRules } from "./assistant-rules";
import { contextSection, skillsSection } from "./context-sections";
import { formatsSection, type PromptFormats } from "./formats-section";
import type { AssistantLocale, PageContext } from "./page-context-schema";
import { PRODUCT_CONTEXT } from "./product-context";

export type BuildSystemPromptInput = {
  organizationId: string;
  locale: AssistantLocale;
  page?: PageContext;
  skills: readonly PromptSkill[];
  /** The signed-in user's fixed role(s) and permissions (ADR 0048). */
  access: { roles: readonly string[]; permissions: PermissionSet };
  /** The user's date, time, number and amount formats (ADR 0046, #482); left out in tests. */
  formats?: PromptFormats;
  now?: Date;
};

/**
 * System instructions for one run: product, rules, context (org/page), what the user may change,
 * skill catalogue and, on
 * `/onboarding`, the first setup.
 */
export function buildSystemPrompt({
  organizationId,
  locale,
  page,
  skills,
  access,
  formats,
  now = new Date(),
}: BuildSystemPromptInput): string {
  const rules = assistantRules({ locale }).map((rule) => `- ${rule}`);
  return [
    PRODUCT_CONTEXT,
    ["## Rules", ...rules].join("\n"),
    contextSection({ organizationId, now, ...(page ? { page } : {}) }),
    ...(formats ? [formatsSection({ ...formats, now })] : []),
    accessSection(access),
    skillsSection({ skills }),
  ].join("\n\n");
}
