import { listAlternativeGroups, type OrderDto } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { loadOrderLines } from "@/features/line/load-order-lines";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { AlternativeGroupTable } from "./alternative-group-table";
import { CreateAlternativeGroupButton } from "./create-alternative-group-button";
import type { OptionLine } from "./option-line";

export type AlternativeGroupSectionProps = { locale: Locale; order: OrderDto };

/** The order's alternatives (ADR 0052): lines the customer picks one of, chosen from here. */
export async function AlternativeGroupSection({ locale, order }: AlternativeGroupSectionProps) {
  const [t, abilities, groups, lines] = await Promise.all([
    getTranslations("alternativeGroup"),
    getCallerAbilities(),
    runOperation({ operation: listAlternativeGroups, input: { orderId: order.id, limit: 100 } }),
    loadOrderLines({ orderId: order.id }),
  ]);
  const lineWrite = can({ abilities, permission: "program:write" });
  if (!groups.ok && groups.error.code === "FORBIDDEN") return null;
  if (!groups.ok) {
    return <ErrorState inline errorKey={handleLoadError({ error: groups.error, locale })} />;
  }
  if (!lines.ok)
    return <ErrorState inline errorKey={handleLoadError({ error: lines.error, locale })} />;
  const options: OptionLine[] = lines.value.items.map(({ id, name, alternativeGroupId }) => ({
    ...{ id, name, alternativeGroupId },
  }));
  const free = options.filter((line) => line.alternativeGroupId === null);
  return (
    <section className="grid grid-cols-1 gap-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl">{t("plural")}</h2>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>
        {lineWrite && free.length >= 2 ? (
          <CreateAlternativeGroupButton orderId={order.id} lines={free} />
        ) : null}
      </div>
      {groups.value.items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <AlternativeGroupTable groups={groups.value.items} lines={options} canWrite={lineWrite} />
      )}
    </section>
  );
}
