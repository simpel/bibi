import type { PermissionSet } from "@bibi/core";
import type { PromptSkill } from "../skills/skill-wire";
import { accessSection } from "./access-section";
import { assistantMode, modeSection } from "./assistant-mode";
import { assistantRules } from "./assistant-rules";
import { contextSection, skillsSection } from "./context-sections";
import type { AssistantLocale, PageContext } from "./page-context-schema";
import { PRODUCT_CONTEXT } from "./product-context";

export type BuildSystemPromptInput = {
  organizationId: string;
  locale: AssistantLocale;
  page?: PageContext;
  skills: readonly PromptSkill[];
  /** The signed-in user's fixed role(s) and permissions (ADR 0048). */
  access: { roles: readonly string[]; permissions: PermissionSet };
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
  now = new Date(),
}: BuildSystemPromptInput): string {
  const rules = assistantRules({ locale }).map((rule) => `- ${rule}`);
  const mode = modeSection({ mode: assistantMode({ page }) });
  return [
    PRODUCT_CONTEXT,
    ["## Rules", ...rules].join("\n"),
    contextSection({ organizationId, now, ...(page ? { page } : {}) }),
    accessSection(access),
    skillsSection({ skills }),
    ...(mode ? [mode] : []),
  ].join("\n\n");
}
