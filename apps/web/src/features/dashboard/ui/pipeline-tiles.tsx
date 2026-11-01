import type { DashboardSummary, NumberFormat } from "@bibi/core/schemas";
import { type MoneyTotalItem, MoneyTotals } from "@bibi/ui";
import { useTranslations } from "next-intl";

export type PipelineTilesProps = {
  statuses: DashboardSummary["statuses"];
  currency: string;
  numbers: NumberFormat;
};

type Status = DashboardSummary["statuses"][number];
type Label = (key: "confirmed" | "confirmedLabel" | "estimated" | "estimatedLabel") => string;

/** The agreed value and the estimate of one status, excl. VAT; each only when known. */
function valueItems({ status, t }: { status: Status; t: Label }): MoneyTotalItem[] {
  const items: MoneyTotalItem[] = [];
  if (status.confirmedValueMinor !== null) {
    const { confirmedValueMinor: minor } = status;
    items.push({
      ...{ key: "confirmed", label: t("confirmedLabel"), description: t("confirmed") },
      ...{ minor, tone: "positive" },
    });
  }
  if (status.estimatedValueMinor !== null) {
    const { estimatedValueMinor: minor } = status;
    items.push({
      ...{ key: "estimated", label: t("estimatedLabel"), description: t("estimated") },
      ...{ minor, tone: "pending" },
    });
  }
  return items;
}

/** One tile per open status, now: the ticket count, the agreed value and the estimate (ADR 0079). */
export function PipelineTiles({ statuses, currency, numbers }: PipelineTilesProps) {
  const t = useTranslations("dashboard.pipeline");
  const value = useTranslations("pipeline.phaseValue");
  const flow = numbers.moneyFlow({ currency });
  if (statuses.length === 0) return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  return (
    <section aria-label={t("title")} className="grid gap-3">
      <h2 className="text-base">{t("title")}</h2>
      <div
        data-slot="pipeline-tiles"
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3"
      >
        {statuses.map((status) => {
          const items = valueItems({ status, t: value });
          return (
            <div key={status.statusId} className="grid gap-2 rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">{status.name}</p>
              <p className="text-2xl tabular-nums">{t("tickets", { count: status.tickets })}</p>
              {items.length === 0 ? (
                <p className="text-xs text-muted-foreground">{t("noValue")}</p>
              ) : (
                <MoneyTotals items={items} flow={flow} size="sm" />
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
