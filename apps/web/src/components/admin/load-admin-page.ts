import { getTranslations } from "next-intl/server";
import { type AdminKey, visibleSections } from "@/components/shell/admin-items";
import type { AdminSectionId } from "@/components/shell/admin-sections";
import { getCallerAbilities } from "@/server/caller-abilities";

export type AdminPageContext = { title: string; show: ReadonlySet<AdminSectionId> };

/** An administration page's name and the sections the caller may view (ADR 0050). */
export async function loadAdminPage({ key }: { key: AdminKey }): Promise<AdminPageContext> {
  const [nav, { permissions }] = await Promise.all([getTranslations("nav"), getCallerAbilities()]);
  return { title: nav(key), show: visibleSections({ permissions, key }) };
}
