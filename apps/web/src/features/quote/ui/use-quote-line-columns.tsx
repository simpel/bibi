import type { LineChange, OrderLineDto } from "@bibi/core/schemas";
import { Badge, type BadgeProps, type ColumnDef } from "@bibi/ui";
import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";
import { formatKr } from "../../item/ui/format-price";
import { LineVatRows } from "./line-vat-rows";

const CHANGE_VARIANT: Record<LineChange, BadgeProps["variant"]> = {
  ADDED: "success",
  CHANGED: "warning",
  UNCHANGED: "outline",
};

/** A line of the quote, or a line this version removed (shown struck through). */
export type QuoteLineRow = {
  line: OrderLineDto & { change?: LineChange | null };
  removed: boolean;
};

type Column = ColumnDef<QuoteLineRow>;
type Translate = ReturnType<typeof useTranslations<"quote">>;

const STRUCK = "text-muted-foreground line-through";

type ValueColumnInput = {
  t: Translate;
  id: "quantity" | "unitPrice" | "discount" | "vat" | "total";
  sort: (line: QuoteLineRow["line"]) => number;
  show: (line: QuoteLineRow["line"]) => string | number;
};

/** A plain value column that is struck through on removed lines. */
const valueColumn = ({ t, id, sort, show }: ValueColumnInput): Column => ({
  id,
  header: t(`lines.${id}`),
  accessorFn: ({ line }) => sort(line),
  cell: ({ row: { original } }) => (
    <span className={original.removed ? STRUCK : undefined}>{show(original.line)}</span>
  ),
});

const itemColumn = ({ t }: { t: Translate }): Column => ({
  id: "item",
  header: t("lines.item"),
  accessorFn: ({ line }) => line.name,
  cell: ({ row: { original } }) => (
    <span className={original.removed ? STRUCK : undefined}>
      <span className="font-medium">{original.line.name}</span>
      {original.line.alternativeGroupName ? (
        <span className="block text-xs text-muted-foreground">
          {t("lines.option", { name: original.line.alternativeGroupName })}
          {original.line.inTotal ? null : ` · ${t("lines.notInTotal")}`}
        </span>
      ) : null}
      {original.line.tags.length > 0 ? (
        <span className="block text-xs text-muted-foreground">
          {original.line.tags.map((tag) => tag.name).join(", ")}
        </span>
      ) : null}
    </span>
  ),
});

const vatColumn = ({ t }: { t: Translate }): Column => ({
  id: "vat",
  header: t("lines.vat"),
  accessorFn: ({ line }) => line.vatRatePercent,
  cell: ({ row: { original } }) => (
    <span className={original.removed ? STRUCK : undefined}>
      {original.line.vatRatePercent} %
      <LineVatRows line={original.line} />
    </span>
  ),
});

const changeColumn = ({ t }: { t: Translate }): Column => ({
  id: "change",
  header: t("lines.change"),
  accessorFn: ({ line, removed }) => (removed ? "REMOVED" : (line.change ?? "")),
  cell: ({ row: { original } }) => {
    if (original.removed) return <Badge variant="destructive">{t("changes.REMOVED")}</Badge>;
    const { change } = original.line;
    return change ? <Badge variant={CHANGE_VARIANT[change]}>{t(`changes.${change}`)}</Badge> : null;
  },
});

/** Item · quantity · unit price · discount · VAT · total · change marker. */
export function useQuoteLineColumns(): Column[] {
  const t = useTranslations("quote");
  const locale = useLocale();
  return useMemo<Column[]>(() => {
    const kr = ({ minor }: { minor: number }) =>
      t("amount", { amount: formatKr({ minor, locale }) });
    return [
      itemColumn({ t }),
      valueColumn({ t, id: "quantity", sort: (l) => l.quantity, show: (l) => l.quantity }),
      valueColumn({
        t,
        id: "unitPrice",
        sort: (l) => l.unitPriceMinor,
        show: (l) => kr({ minor: l.unitPriceMinor }),
      }),
      valueColumn({
        t,
        id: "discount",
        sort: (l) => l.discountPercent ?? 0,
        show: (l) => (l.discountPercent ? `${l.discountPercent} %` : "–"),
      }),
      vatColumn({ t }),
      valueColumn({
        t,
        id: "total",
        sort: (l) => l.totalExclVatMinor,
        show: (l) => kr({ minor: l.totalExclVatMinor }),
      }),
      changeColumn({ t }),
    ];
  }, [t, locale]);
}
