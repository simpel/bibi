import { resolveLocale } from "@bibi/i18n";
import { setRequestLocale } from "next-intl/server";
import { AdminSections } from "@/components/admin/admin-sections";
import { loadAdminPage } from "@/components/admin/load-admin-page";
import { OrderTemplateList } from "@/features/order-template/ui/order-template-list";
import { pageTitle } from "@/lib/page-metadata";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params;
  return pageTitle({ locale, namespace: "nav", key: "orderTemplates" });
}

export default async function OrderTemplatesPage({ params }: PageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  const { title, show } = await loadAdminPage({ key: "orderTemplates" });
  return (
    <AdminSections title={title}>
      {show.has("orderTemplates") ? <OrderTemplateList locale={locale} /> : null}
    </AdminSections>
  );
}
