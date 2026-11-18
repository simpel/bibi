import { listRunSheetDefinitions, listRunSheets, type OrderDto } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { RunSheetPanel } from "./run-sheet-panel";

export type RunSheetSectionProps = { locale: Locale; order: OrderDto };

/**
 * The order's run sheets (ADR 0021): per run sheet definition the newest version, with ★ on the rows
 * changed since the last sent one. Versions go out only from the confirmed status (`runSheet.send`).
 */
export async function RunSheetSection({ locale, order }: RunSheetSectionProps) {
  const [abilities, t, definitions, runSheets] = await Promise.all([
    getCallerAbilities(),
    getTranslations("runSheet"),
    runOperation({ operation: listRunSheetDefinitions, input: { limit: 100 } }),
    runOperation({ operation: listRunSheets, input: { orderId: order.id, limit: 100 } }),
  ]);
  for (const result of [definitions, runSheets]) {
    if (!result.ok && result.error.code === "FORBIDDEN") return null;
    if (!result.ok)
      return <ErrorState inline errorKey={handleLoadError({ error: result.error, locale })} />;
  }
  if (!definitions.ok || !runSheets.ok) return null;
  // Versions are made when the order changes, so a type with none does not apply (yet): not shown.
  const panels = definitions.value.items.flatMap((definition) => {
    const runSheet = runSheets.value.items.find(
      (item) => item.runSheetDefinitionId === definition.id,
    );
    return runSheet ? [{ definition, runSheet }] : [];
  });
  return (
    <section className="grid grid-cols-1 gap-4">
      <h2 className="text-xl">{t("plural")}</h2>
      {panels.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("noneForOrder")}</p>
      ) : (
        panels.map(({ definition, runSheet }) => (
          <RunSheetPanel
            key={definition.id}
            definition={definition}
            runSheet={runSheet}
            canSend={can({ abilities, permission: "runSheet:write" })}
          />
        ))
      )}
    </section>
  );
}
