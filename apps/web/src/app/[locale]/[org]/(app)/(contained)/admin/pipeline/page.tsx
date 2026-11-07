import { resolveLocale } from "@bibi/i18n";
import { setRequestLocale } from "next-intl/server";
import { AdminSections } from "@/components/admin/admin-sections";
import { loadAdminPage } from "@/components/admin/load-admin-page";
import { ItemStateList } from "@/features/item-state/ui/item-state-list";
import { OrderStatusList } from "@/features/order-status/ui/order-status-list";
import { pageTitle } from "@/lib/page-metadata";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params;
  return pageTitle({ locale, namespace: "nav", key: "orderFlow" });
}

export default async function OrderFlowPage({ params }: PageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  const { title, show } = await loadAdminPage({ key: "orderFlow" });
  return (
    <AdminSections title={title}>
      <OrderStatusList locale={locale} show={show} />
      {show.has("itemStates") ? <ItemStateList locale={locale} /> : null}
    </AdminSections>
  );
}
