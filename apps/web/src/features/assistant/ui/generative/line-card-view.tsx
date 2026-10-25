"use client";

import { Badge, Card, CardContent, CardHeader, CardTitle } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/navigation";
import { useNumberFormat } from "@/lib/number/use-number-format";
import { ticketRoute } from "@/lib/routes";
import { useDateTimeFormat } from "@/lib/time/use-date-time-format";
import type { GenerativeProps } from "./generative-props";
import { fieldLines } from "./item-facts";
import { linePeriod } from "./occupancy-period";

export type LineCardViewProps = GenerativeProps<"line-card">;

/** One line: name, time (or none), effective quantity and unit price, and own fields. */
export function LineCardView({ line }: LineCardViewProps) {
  const t = useTranslations("assistant.ui.line");
  const format = useDateTimeFormat();
  const href = ticketRoute({ id: line.ticketId });
  const { money } = useNumberFormat();
  const { effectiveQuantity: quantity, effectiveUnitPriceMinor: price } = line;
  return (
    <Card data-slot="line-card" className="shadow-none">
      <CardHeader className="flex-row items-start justify-between gap-2 p-4 pb-2">
        <CardTitle className="text-base">{line.name}</CardTitle>
        <Badge variant="secondary">{t("singular")}</Badge>
      </CardHeader>
      <CardContent className="grid gap-1 p-4 pt-0 text-sm text-muted-foreground">
        <p>{linePeriod({ format, ...line }) ?? t("untimed")}</p>
        {quantity === null ? null : <p>{t("quantity", { count: quantity })}</p>}
        {price === null ? null : <p>{t("unitPrice", { price: money({ minor: price }) })}</p>}
        {line.status === "ARCHIVED" ? <p>{t("archived")}</p> : null}
        {fieldLines({ fields: line.fields }).map((text) => (
          <p key={text}>{text}</p>
        ))}
        <Link href={href} className="text-primary hover:underline">
          {t("openTicket")}
        </Link>
      </CardContent>
    </Card>
  );
}
