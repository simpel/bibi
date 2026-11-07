import { SimplePage } from "@bibi/ui";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { adminTabs } from "@/components/shell/admin-items";
import { PageHeader } from "@/components/states/page-header";
import { getCallerAbilities } from "@/server/caller-abilities";
import { AdminTabs } from "./admin-tabs";

/** The administration pages that hold more than one tab. */
export type TabbedAdminPage = "types" | "orderFlow" | "runSheets" | "integrations";

export type AdminTabLayoutProps = { page: TabbedAdminPage; children: ReactNode };

/**
 * The frame of an administration page with tabs: its title, description and the tabs the caller
 * may see stay put while the tabs below change (`apps/web/CLAUDE.md`, path tabs in a layout).
 */
export async function AdminTabLayout({ page, children }: AdminTabLayoutProps) {
  const [nav, t, { permissions }] = await Promise.all([
    getTranslations("nav"),
    getTranslations("adminArea"),
    getCallerAbilities(),
  ]);
  const tabs = adminTabs({ permissions, key: page });
  return (
    <SimplePage>
      <div className="grid gap-6">
        <div className="grid gap-4">
          <PageHeader title={nav(page)} description={t(`descriptions.${page}`)} />
          {tabs.length > 1 ? <AdminTabs tabs={tabs} label={nav(page)} /> : null}
        </div>
        {children}
      </div>
    </SimplePage>
  );
}
