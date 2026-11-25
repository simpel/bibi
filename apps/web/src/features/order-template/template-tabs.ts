import { canPermission } from "@/lib/can";
import type { CallerAbilities } from "@/server/caller-abilities";

/** The booking template page's tabs, in order; each is its own URL (`?tab=`). */
export const TEMPLATE_TABS = ["lines", "history", "danger"] as const;

export type TemplateTab = (typeof TEMPLATE_TABS)[number];

/**
 * Lines (opened first) are every template's; History needs `audit:read`; the danger area, last,
 * needs `orderTemplate:delete` (spec: danger-area).
 */
export function availableTemplateTabs({ abilities }: { abilities: CallerAbilities }) {
  const { permissions } = abilities;
  const shown: Record<TemplateTab, boolean> = {
    lines: true,
    history: canPermission({ permissions, permission: "audit:read" }),
    danger: canPermission({ permissions, permission: "orderTemplate:delete" }),
  };
  return TEMPLATE_TABS.filter((tab) => shown[tab]);
}

export type PickTemplateTabInput = { value: string | undefined; available: readonly TemplateTab[] };

/** The tab the URL names when the caller has it, else the first. */
export function pickTemplateTab({ value, available }: PickTemplateTabInput): TemplateTab {
  return available.find((tab) => tab === value) ?? available[0] ?? "lines";
}
