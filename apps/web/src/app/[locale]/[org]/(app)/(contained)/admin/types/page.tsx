import { resolveLocale } from "@bibi/i18n";
import { setRequestLocale } from "next-intl/server";
import { AdminSections } from "@/components/admin/admin-sections";
import { loadAdminPage } from "@/components/admin/load-admin-page";
import { EntityTypeList } from "@/features/entity-type/ui/entity-type-list";
import { ItemTypeGroupList } from "@/features/item-type-group/ui/item-type-group-list";
import { SetupList } from "@/features/setup/ui/setup-list";
import { pageTitle } from "@/lib/page-metadata";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params;
  return pageTitle({ locale, namespace: "nav", key: "types" });
}

export default async function TypesPage({ params }: PageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  const { title, show } = await loadAdminPage({ key: "types" });
  return (
    <AdminSections title={title}>
      {show.has("types") ? <EntityTypeList locale={locale} /> : null}
      {show.has("groups") ? <ItemTypeGroupList locale={locale} /> : null}
      {show.has("setups") ? <SetupList locale={locale} /> : null}
    </AdminSections>
  );
}
