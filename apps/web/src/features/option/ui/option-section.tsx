import { listOptions } from "@okazi/core";
import type { Locale } from "@okazi/i18n";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { getCallerAbilities } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { OptionQueueActions } from "./option-queue-actions";
import { OptionTable } from "./option-table";

export type OptionSectionProps = { locale: Locale; itemId: string };

/** A bookable item's option queue (ADR 0022): active options by start and rank. */
export async function OptionSection({ locale, itemId }: OptionSectionProps) {
  const t = await getTranslations("option");
  const { optionWrite } = await getCallerAbilities();
  const options = await runOperation({
    operation: listOptions,
    input: { itemId, optionStatus: "ACTIVE", limit: 100 },
  });
  if (!options.ok) {
    return <ErrorState errorKey={handleLoadError({ error: options.error, locale })} />;
  }
  return (
    <section className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-lg font-semibold">{t("plural")}</h2>
        {optionWrite ? <OptionQueueActions itemId={itemId} /> : null}
      </div>
      {options.value.items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <OptionTable options={options.value.items} canWrite={optionWrite} />
      )}
    </section>
  );
}
