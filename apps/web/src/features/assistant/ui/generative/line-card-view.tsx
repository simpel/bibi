"use client";

import { Link } from "@bibi/i18n/navigation";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@bibi/ui";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { ticketRoute } from "@/lib/routes";
import { formatKr } from "../../../item/ui/format-price";
import type { GenerativeProps } from "./generative-props";
import { fieldLines } from "./item-facts";
import { linePeriod } from "./occupancy-period";

export type LineCardViewProps = GenerativeProps<"line-card">;

/** One line: name, time (or none), effective quantity and unit price, and own fields. */
export function LineCardView({ line }: LineCardViewProps) {
  const t = useTranslations("assistant.ui.line");
  const format = useFormatter();
  const href = ticketRoute({ id: line.ticketId });
  const locale = useLocale();
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
        {price === null ? null : (
          <p>{t("unitPrice", { price: formatKr({ minor: price, locale }) })}</p>
        )}
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
