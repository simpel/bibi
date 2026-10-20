import { resolveLocale } from "@okazi/i18n";
import { setRequestLocale } from "next-intl/server";
import { PermissionGate } from "@/components/states/permission-gate";
import { ItemCreate } from "@/features/item/ui/item-create";
import { readCursor } from "@/lib/page-cursor";

type NewItemPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ type?: string | string[] }>;
};

export default async function NewItemPage({ params, searchParams }: NewItemPageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  return (
    <PermissionGate permission="item:write">
      <ItemCreate locale={locale} typeId={readCursor({ value: (await searchParams).type })} />
    </PermissionGate>
  );
}
