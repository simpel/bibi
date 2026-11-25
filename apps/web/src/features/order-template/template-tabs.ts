import { canPermission } from "@/lib/can";
import type { CallerAbilities } from "@/server/caller-abilities";

/** The booking template page's tabs, in order; each is its own URL (`?tab=`). */
export const TEMPLATE_TABS = ["lines", "history"] as const;

export type TemplateTab = (typeof TEMPLATE_TABS)[number];

/** Lines (opened first) are every template's; History needs `audit:read`. */
export function availableTemplateTabs({ abilities }: { abilities: CallerAbilities }) {
  const history = canPermission({ permissions: abilities.permissions, permission: "audit:read" });
  return TEMPLATE_TABS.filter((tab) => tab !== "history" || history);
}

export type PickTemplateTabInput = { value: string | undefined; available: readonly TemplateTab[] };

/** The tab the URL names when the caller has it, else the first. */
export function pickTemplateTab({ value, available }: PickTemplateTabInput): TemplateTab {
  return available.find((tab) => tab === value) ?? available[0] ?? "lines";
}
