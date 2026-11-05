import { resolveLocale } from "@bibi/i18n";
import { SimplePage } from "@bibi/ui";
import { setRequestLocale } from "next-intl/server";
import { PermissionGate } from "@/components/states/permission-gate";
import { loadItem } from "@/features/item/load-item";
import { ItemUpdate } from "@/features/item/ui/item-update";
import { entityTitle } from "@/lib/page-metadata";

type UpdateItemPageProps = { params: Promise<{ locale: string; id: string }> };

export async function generateMetadata({ params }: UpdateItemPageProps) {
  const { id } = await params;
  const item = await loadItem({ id });
  return entityTitle({
    name: item.ok ? item.value.name : null,
    fallback: "Item",
    prefix: "Edit",
  });
}

export default async function UpdateItemPage({ params }: UpdateItemPageProps) {
  const { locale: rawLocale, id } = await params;
  const locale = resolveLocale({ value: rawLocale });
  setRequestLocale(locale);
  return (
    <SimplePage>
      <PermissionGate permission="item:write">
        <ItemUpdate locale={locale} id={id} />
      </PermissionGate>
    </SimplePage>
  );
}
