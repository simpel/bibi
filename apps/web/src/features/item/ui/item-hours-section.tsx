import { getItemHours } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { ErrorState } from "@/components/states/error-state";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { ItemHoursEditor } from "./item-hours-editor";

export type ItemHoursSectionProps = { locale: Locale; itemId: string };

/** Working hours of an item; without its own it follows its venue's opening hours (ADR 0064). */
export async function ItemHoursSection({ locale, itemId }: ItemHoursSectionProps) {
  const result = await runOperation({ operation: getItemHours, input: { itemId } });
  if (!result.ok)
    return <ErrorState inline errorKey={handleLoadError({ error: result.error, locale })} />;
  const abilities = await getCallerAbilities();
  return (
    <section className="grid gap-3">
      <ItemHoursEditor
        itemId={itemId}
        initial={{ days: result.value.days, exceptions: result.value.exceptions }}
        canEdit={can({ abilities, permission: "item:write" })}
      />
    </section>
  );
}
