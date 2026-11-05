import { resolveLocale } from "@bibi/i18n";
import { SimplePage } from "@bibi/ui";
import { setRequestLocale } from "next-intl/server";
import { PermissionGate } from "@/components/states/permission-gate";
import { ItemStatePage } from "@/features/item-state/ui/item-state-page";
import { pageTitle } from "@/lib/page-metadata";

type NewItemStatePageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ type?: string }>;
};

export async function generateMetadata({ params }: NewItemStatePageProps) {
  const { locale } = await params;
  return pageTitle({ locale, namespace: "itemState", key: "create" });
}

export default async function NewItemStatePage({ params, searchParams }: NewItemStatePageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  const { type = "" } = await searchParams;
  return (
    <SimplePage>
      <PermissionGate permission="pipeline:write">
        <ItemStatePage locale={locale} mode={{ create: type }} />
      </PermissionGate>
    </SimplePage>
  );
}
