"use client";

import { Tabs, TabsList, TabsTrigger } from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { AdminTab } from "@/components/shell/admin-items";
import { activeHref } from "@/components/shell/sidebar-link";
import { Link, usePathname } from "@/lib/navigation";

export type AdminTabsProps = { tabs: readonly AdminTab[]; label: string };

/** The tabs of an administration page; each tab is its own URL (ADR 0036). */
export function AdminTabs({ tabs, label }: AdminTabsProps) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const current = activeHref({ pathname, hrefs: tabs.map((tab) => tab.href) }) ?? "";
  return (
    <Tabs value={current}>
      <TabsList aria-label={label}>
        {tabs.map((tab) => (
          <TabsTrigger key={tab.href} value={tab.href} asChild>
            <Link href={tab.href}>{t(tab.key)}</Link>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
