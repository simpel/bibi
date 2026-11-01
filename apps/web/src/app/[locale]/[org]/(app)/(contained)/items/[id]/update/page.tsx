import { resolveLocale } from "@bibi/i18n";
import { SimplePage } from "@bibi/ui";
import { setRequestLocale } from "next-intl/server";
import { PermissionGate } from "@/components/states/permission-gate";
import { ItemUpdate } from "@/features/item/ui/item-update";

type UpdateItemPageProps = { params: Promise<{ locale: string; id: string }> };

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
