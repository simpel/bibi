import { resolveItem } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { ItemResolutionView } from "./item-resolution-view";

export type ItemResolutionSectionProps = { locale: Locale; itemId: string };

/** A composed item's inherited list values and expanded parts, computed by `item.resolve`. */
export async function ItemResolutionSection({ locale, itemId }: ItemResolutionSectionProps) {
  const t = await getTranslations("item.resolution");
  const resolution = await runOperation({ operation: resolveItem, input: { id: itemId } });
  if (!resolution.ok) {
    return <ErrorState errorKey={handleLoadError({ error: resolution.error, locale })} />;
  }
  return (
    <section className="grid gap-4">
      <h2 className="text-lg font-semibold">{t("title")}</h2>
      <ItemResolutionView resolution={resolution.value} />
    </section>
  );
}
