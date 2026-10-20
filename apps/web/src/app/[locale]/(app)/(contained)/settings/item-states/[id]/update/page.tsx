import { resolveLocale } from "@okazi/i18n";
import { setRequestLocale } from "next-intl/server";
import { PermissionGate } from "@/components/states/permission-gate";
import { ItemStatePage } from "@/features/item-state/ui/item-state-page";

type UpdateItemStatePageProps = { params: Promise<{ locale: string; id: string }> };

export default async function UpdateItemStatePage({ params }: UpdateItemStatePageProps) {
  const { locale: rawLocale, id } = await params;
  const locale = resolveLocale({ value: rawLocale });
  setRequestLocale(locale);
  return (
    <PermissionGate permission="pipeline:write">
      <ItemStatePage locale={locale} mode={{ update: id }} />
    </PermissionGate>
  );
}
