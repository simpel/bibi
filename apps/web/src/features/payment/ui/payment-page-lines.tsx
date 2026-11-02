import type { NumberFormat, PublicPaymentDto, PublicPaymentLine } from "@bibi/core/schemas";
import { Badge, cn } from "@bibi/ui";
import { useTranslations } from "next-intl";

type Money = (amount: { minor: number }) => string;

type LineProps = { line: PublicPaymentLine; money: Money };

/** The line's quantity × unit price, its discount and whether it counts; a part has no price. */
function LineDetail({ line, money }: LineProps) {
  const t = useTranslations("payment.public");
  const priced = line.role !== "PART";
  const parts = [
    priced
      ? t("quantityPrice", {
          quantity: line.quantity,
          price: money({ minor: line.unitPriceMinor }),
        })
      : t("quantity", { quantity: line.quantity }),
    priced && line.discountPercent ? t("discount", { percent: line.discountPercent }) : null,
    priced && !line.inTotal ? t("notInTotal") : null,
  ];
  return (
    <span className="block text-xs text-muted-foreground">
      {parts.filter((part) => part !== null).join(" · ")}
    </span>
  );
}

const ROLE_KEY = { ADD_ON: "addOn", OPTION: "option" } as const;

/** One line: name and badge with its total, the detail beneath; a sub-line is indented. */
function LineItem({ line, money }: LineProps) {
  const t = useTranslations("payment.public");
  const roleKey = line.role === "ADD_ON" || line.role === "OPTION" ? ROLE_KEY[line.role] : null;
  return (
    <li className={cn("flex items-start justify-between gap-3 py-2", line.subLine && "pl-4")}>
      <span className="min-w-0">
        <span className={cn("break-words", line.subLine ? "text-sm" : "font-medium")}>
          {line.name}
        </span>
        {roleKey ? (
          <Badge variant="outline" className="ml-2">
            {t(roleKey)}
          </Badge>
        ) : null}
        <LineDetail line={line} money={money} />
      </span>
      {line.role === "PART" ? null : (
        <span className={cn("shrink-0 text-sm tabular-nums", !line.inTotal && "line-through")}>
          {money({ minor: line.totalExclVatMinor })}
        </span>
      )}
    </li>
  );
}

type TotalsProps = { totals: NonNullable<PublicPaymentDto["totals"]>; money: Money };

/** Excl. VAT, VAT and the total incl. VAT ("from" while an alternative is unchosen). */
function Totals({ totals, money }: TotalsProps) {
  const t = useTranslations("payment.public");
  const show = ({ minor }: { minor: number }) =>
    totals.totalIsFrom ? t("from", { amount: money({ minor }) }) : money({ minor });
  const rows = [
    { key: "totalExclVat", minor: totals.totalExclVatMinor },
    { key: "vat", minor: totals.vatMinor },
    { key: "totalInclVat", minor: totals.totalInclVatMinor },
  ] as const;
  return (
    <dl className="grid gap-1 border-t pt-2 text-sm">
      {rows.map(({ key, minor }) => (
        <div key={key} className="flex justify-between gap-3">
          <dt className={key === "totalInclVat" ? "font-medium" : "text-muted-foreground"}>
            {t(key)}
          </dt>
          <dd className={cn("tabular-nums", key === "totalInclVat" && "font-medium")}>
            {show({ minor })}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export type PaymentPageLinesProps = { payment: PublicPaymentDto; numbers: NumberFormat };

/** What the payment is for: the paid quote's or invoice's lines as the customer received them. */
export function PaymentPageLines({ payment, numbers }: PaymentPageLinesProps) {
  const t = useTranslations("payment.public");
  if (payment.lines.length === 0) return null;
  const money: Money = ({ minor }) => numbers.money({ minor, currency: payment.currency });
  return (
    <section className="grid gap-1">
      <h2 className="text-sm text-muted-foreground">{t("lines")}</h2>
      <ul className="divide-y">
        {payment.lines.map((line, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: lines carry no ids; the list never reorders
          <LineItem key={index} line={line} money={money} />
        ))}
      </ul>
      {payment.totals ? <Totals totals={payment.totals} money={money} /> : null}
    </section>
  );
}
