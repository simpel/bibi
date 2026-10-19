import { resolveLocale } from "@okazi/i18n";
import { setRequestLocale } from "next-intl/server";
import { PermissionGate } from "@/components/states/permission-gate";
import { ItemUpdate } from "@/features/item/ui/item-update";

type UpdateItemPageProps = { params: Promise<{ locale: string; id: string }> };

export default async function UpdateItemPage({ params }: UpdateItemPageProps) {
  const { locale: rawLocale, id } = await params;
  const locale = resolveLocale({ value: rawLocale });
  setRequestLocale(locale);
  return (
    <PermissionGate permission="item:edit">
      <ItemUpdate locale={locale} id={id} />
    </PermissionGate>
  );
}
