import type { LineAmounts, LineDto } from "@bibi/core";
import type { NumberFormat } from "@bibi/core/schemas";
import type { ColumnDef } from "@bibi/ui";
import type { useTranslations } from "next-intl";

type Translator = ReturnType<typeof useTranslations<"line">>;

export type AmountColumnsInput = { t: Translator; money?: NumberFormat["money"] };

/** "(inherited)" after a value the line does not set itself (ADR 0052). */
const inherited = ({ t, source }: { t: Translator; source: string | null }) =>
  source && source !== "LINE" ? ` ${t("inherited")}` : "";

/** The effective quantity, marked when inherited. */
export function amountColumns({ t }: AmountColumnsInput): ColumnDef<LineDto>[] {
  return [
    {
      id: "quantity",
      header: t("columns.quantity"),
      accessorFn: (item) => item.effectiveQuantity ?? undefined,
      cell: ({ row: { original } }) =>
        original.effectiveQuantity === null
          ? "–"
          : `${original.effectiveQuantity}${inherited({ t, source: original.quantitySource })}`,
    },
  ];
}

export type AmountColumnInput = {
  t: Translator;
  money: NumberFormat["money"];
  amounts: LineAmounts | null;
};

/**
 * What each priced line costs (`line.amounts`, the draft quote's rules), muted when it does not
 * count in the total (a part, an included option, an unchosen alternative), and the order's
 * total in the footer ("From" while an alternative is unchosen): incl. VAT, the same basis as
 * Billed in the balance, with the excl. VAT sum beneath it.
 */
export function amountColumn({ t, money, amounts }: AmountColumnInput): ColumnDef<LineDto> {
  const byLine = new Map((amounts?.lines ?? []).map((amount) => [amount.lineId, amount]));
  const total = amounts ? money({ minor: amounts.totalInclVatMinor }) : "–";
  return {
    id: "amount",
    header: t("columns.amount"),
    accessorFn: (item) => byLine.get(item.id)?.totalExclVatMinor ?? undefined,
    cell: ({ row: { original } }) => {
      const amount = byLine.get(original.id);
      if (!amount) return "–";
      return (
        <span
          className={amount.inTotal ? "tabular-nums" : "tabular-nums text-muted-foreground"}
          title={amount.inTotal ? undefined : t("notInTotal")}
        >
          {money({ minor: amount.totalExclVatMinor })}
        </span>
      );
    },
    footer: () => (
      <span className="flex flex-col whitespace-nowrap tabular-nums">
        <span className="font-medium">
          {amounts?.totalIsFrom ? t("totalFrom", { amount: total }) : total}
        </span>
        {amounts ? (
          <span className="text-xs text-muted-foreground">
            {t("totalExclVat", { amount: money({ minor: amounts.totalExclVatMinor }) })}
          </span>
        ) : null}
      </span>
    ),
  };
}
