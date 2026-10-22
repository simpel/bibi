"use client";

import { Badge, Card, CardContent, CardHeader, CardTitle } from "@bibi/ui";
import { useFormatter, useTranslations } from "next-intl";
import { desiredPeriod } from "@/features/ticket/ui/desired-period";
import { Link } from "@/lib/navigation";
import { ticketRoute } from "@/lib/routes";
import type { GenerativeProps } from "./generative-props";
import { fieldLines } from "./item-facts";

export type TicketCardViewProps = GenerativeProps<"ticket-card">;

/** One ticket: reference (link), desired period, headcount and own fields. */
export function TicketCardView({ ticket }: TicketCardViewProps) {
  const t = useTranslations("assistant.ui.ticket");
  const format = useFormatter();
  const href = ticketRoute({ id: ticket.id });
  const headcount = ticket.guaranteedHeadcount ?? ticket.estimatedHeadcount;
  return (
    <Card data-slot="ticket-card" className="shadow-none">
      <CardHeader className="flex-row items-start justify-between gap-2 p-4 pb-2">
        <CardTitle className="text-base">
          <Link href={href} className="hover:underline">
            {t("reference", { reference: ticket.reference })}
          </Link>
        </CardTitle>
        <Badge variant="secondary">{t("singular")}</Badge>
      </CardHeader>
      <CardContent className="grid gap-1 p-4 pt-0 text-sm text-muted-foreground">
        <p>{desiredPeriod({ ticket, format })}</p>
        {headcount === null ? null : <p>{t("headcount", { count: headcount })}</p>}
        {fieldLines({ fields: ticket.fields }).map((line) => (
          <p key={line}>{line}</p>
        ))}
        <Link href={href} className="text-primary hover:underline">
          {t("open")}
        </Link>
      </CardContent>
    </Card>
  );
}
