import { MoneyNumberFlow } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useNumberFormat } from "@/lib/number/use-number-format";
import type { BoardCard } from "../lib/kanban-model";

export type PhaseValueProps = { cards: readonly BoardCard[]; currency: string };

/** Whole currency units: a phase total is an overview, not an amount to the öre. */
const WHOLE = { minimumFractionDigits: 0, maximumFractionDigits: 0 };

type Sums = { confirmed: number | null; estimated: number | null };

/** Confirmed: accepted quotes. Estimated: the cards without one (ADR 0074). Null when none. */
function phaseSums({ cards }: { cards: readonly BoardCard[] }): Sums {
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
 * The phase's agreed value and the estimate of its other tickets, excl. VAT, stacked in the
 * header. Both animate when a moved card refreshes the board.
 */
export function PhaseValue({ cards, currency }: PhaseValueProps) {
  const t = useTranslations("pipeline.phaseValue");
  const flow = useNumberFormat().moneyFlow({ currency });
  const { confirmed, estimated } = phaseSums({ cards });
  if (confirmed === null && estimated === null) return null;
  return (
    <span className="flex flex-col items-center leading-tight">
      {confirmed !== null ? (
        <span title={t("confirmed")} className="text-foreground">
          <MoneyNumberFlow value={Math.round(confirmed / 100)} flow={flow} format={WHOLE} />
        </span>
      ) : null}
      {estimated !== null ? (
        <span title={t("estimated")}>
          <MoneyNumberFlow
            value={Math.round(estimated / 100)}
            flow={flow}
            format={WHOLE}
            lead="≈ "
          />
        </span>
      ) : null}
    </span>
  );
}
