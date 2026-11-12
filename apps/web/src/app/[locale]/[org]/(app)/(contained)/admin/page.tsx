import { resolveLocale } from "@bibi/i18n";
import { setRequestLocale } from "next-intl/server";
import { AdminOverview } from "@/components/admin/admin-overview";
import { visibleAdminGroups } from "@/components/shell/admin-items";
import { getCallerAbilities } from "@/server/caller-abilities";

type AdminPageProps = { params: Promise<{ locale: string }> };

/** `/admin` is the area's start page: every page the caller may view (the layout gates access). */
export default async function AdminPage({ params }: AdminPageProps) {
  const [{ locale }, { permissions }] = await Promise.all([params, getCallerAbilities()]);
  setRequestLocale(resolveLocale({ value: locale }));
  return <AdminOverview groups={visibleAdminGroups({ permissions })} />;
}
