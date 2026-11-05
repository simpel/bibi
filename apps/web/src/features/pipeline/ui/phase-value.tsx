import type { PipelineCard } from "@bibi/core";
import { type MoneyTotalItem, MoneyTotals, type MoneyTotalsProps } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useNumberFormat } from "@/lib/number/use-number-format";

export type PhaseValueProps = {
  cards: readonly PipelineCard[];
  currency: string;
  /** `md` next to the board switcher, `sm` in a lane header. */
  size: NonNullable<MoneyTotalsProps["size"]>;
};

type Sums = { confirmed: number | null; estimated: number | null };

/** Confirmed: accepted quotes. Estimated: the cards without one (ADR 0074). Null when none. */
function phaseSums({ cards }: { cards: readonly PipelineCard[] }): Sums {
  let confirmed: number | null = null;
  let estimated: number | null = null;
  for (const card of cards) {
    if (card.confirmedValueMinor !== null) {
      confirmed = (confirmed ?? 0) + card.confirmedValueMinor;
    } else if (card.estimatedValueMinor !== null) {
      estimated = (estimated ?? 0) + card.estimatedValueMinor;
    }
  }
  return { confirmed, estimated };
}

/**
 * The agreed value and the estimate of the other orders, excl. VAT, exact to the öre. Both
 * animate when a moved card refreshes the board.
 */
export function PhaseValue({ cards, currency, size }: PhaseValueProps) {
  const t = useTranslations("pipeline.phaseValue");
  const flow = useNumberFormat().moneyFlow({ currency });
  const { confirmed, estimated } = phaseSums({ cards });
  const items: MoneyTotalItem[] = [];
  if (confirmed !== null) {
    items.push({
      key: "confirmed",
      label: t("confirmedLabel"),
      description: t("confirmed"),
      minor: confirmed,
      tone: "positive",
    });
  }
  if (estimated !== null) {
    items.push({
      key: "estimated",
      label: t("estimatedLabel"),
      description: t("estimated"),
      minor: estimated,
      tone: "pending",
    });
  }
  return <MoneyTotals items={items} flow={flow} size={size} />;
}
