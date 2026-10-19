import type { AiFeatureId } from "@okazi/core";
import type { PageContext } from "./page-context-schema";

/** What the assistant is doing in this run; decided by the page the user asks from. */
export type AssistantMode = "assistant" | "first-setup";

/** The system skill the first setup follows (ADR 0045; `packages/core/src/skills/system`). */
export const FIRST_SETUP_SKILL = "first-setup";

/** `/onboarding` (with or without a locale prefix), where a new organization is set up. */
const FIRST_SETUP_ROUTE = /^\/(?:[a-z]{2}\/)?onboarding\/?$/;

export type AssistantModeInput = { page?: PageContext | undefined };

/** The first setup on `/onboarding`, the ordinary assistant everywhere else. */
export function assistantMode({ page }: AssistantModeInput): AssistantMode {
  return page && FIRST_SETUP_ROUTE.test(page.route) ? "first-setup" : "assistant";
}

/** The AI feature whose model a mode uses (ADR 0015). */
export const MODE_FEATURE: Readonly<Record<AssistantMode, AiFeatureId>> = {
  assistant: "assistant.chat",
  "first-setup": "onboarding",
};

/** Extra instructions for a mode; the first setup starts from its skill. */
export function modeSection({ mode }: { mode: AssistantMode }): string | null {
  if (mode !== "first-setup") return null;
  return [
    "## First setup",
    "The user has just created their organization and is on the first-setup page.",
    `Before anything else, load the skill \`load_skill({ slug: "${FIRST_SETUP_SKILL}" })\` ` +
      "and follow it to the end, even when the user writes something else first.",
  ].join("\n");
}
