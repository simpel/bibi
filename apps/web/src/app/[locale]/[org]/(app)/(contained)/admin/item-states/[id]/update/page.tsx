import { resolveLocale } from "@bibi/i18n";
import { SimplePage } from "@bibi/ui";
import { setRequestLocale } from "next-intl/server";
import { PermissionGate } from "@/components/states/permission-gate";
import { loadItemState } from "@/features/item-state/load-item-state";
import { ItemStatePage } from "@/features/item-state/ui/item-state-page";
import { entityTitle } from "@/lib/page-metadata";

type UpdateItemStatePageProps = { params: Promise<{ locale: string; id: string }> };

export async function generateMetadata({ params }: UpdateItemStatePageProps) {
  const { id } = await params;
  const state = await loadItemState({ id });
  return entityTitle({
    name: state.ok ? state.value.name : null,
    fallback: "Item state",
    prefix: "Edit",
  });
}

export default async function UpdateItemStatePage({ params }: UpdateItemStatePageProps) {
  const { locale: rawLocale, id } = await params;
  const locale = resolveLocale({ value: rawLocale });
  setRequestLocale(locale);
  return (
    <SimplePage>
      <PermissionGate permission="pipeline:write">
        <ItemStatePage locale={locale} mode={{ update: id }} />
      </PermissionGate>
    </SimplePage>
  );
}
