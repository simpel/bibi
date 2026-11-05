import { resolveLocale } from "@bibi/i18n";
import { SimplePage } from "@bibi/ui";
import { setRequestLocale } from "next-intl/server";
import { PermissionGate } from "@/components/states/permission-gate";
import { ItemCreate } from "@/features/item/ui/item-create";
import { readCursor } from "@/lib/page-cursor";
import { pageTitle } from "@/lib/page-metadata";

type NewItemPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ type?: string | string[] }>;
};

export async function generateMetadata({ params }: NewItemPageProps) {
  const { locale } = await params;
  return pageTitle({ locale, namespace: "item", key: "create" });
}

export default async function NewItemPage({ params, searchParams }: NewItemPageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  return (
    <SimplePage>
      <PermissionGate permission="item:write">
        <ItemCreate locale={locale} typeId={readCursor({ value: (await searchParams).type })} />
      </PermissionGate>
    </SimplePage>
  );
}
