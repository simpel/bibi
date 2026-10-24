"use client";

import { STATUS_FLAGS } from "@bibi/core/schemas";
import { Badge, Card, CardContent, CardHeader, CardTitle, ColorSwatch } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { ticketStatusesRoute } from "@/lib/configuration-routes";
import { Link } from "@/lib/navigation";
import type { GenerativeProps } from "./generative-props";

export type TicketStatusCardViewProps = GenerativeProps<"ticket-status-card">;

/** One ticket status: color, flags and how many statuses it may move to. */
export function TicketStatusCardView({ ticketStatus }: TicketStatusCardViewProps) {
  const t = useTranslations("assistant.ui.ticketStatus");
  const flags = useTranslations("ticketStatus.flags");
  const active = ticketStatus.status === "ACTIVE";
  const set = STATUS_FLAGS.filter((flag) => ticketStatus[flag]);
  return (
    <Card data-slot="ticket-status-card" className="shadow-none">
      <CardHeader className="flex-row items-start justify-between gap-2 p-4 pb-2">
        <CardTitle className="inline-flex items-center gap-2 text-base">
          <ColorSwatch color={ticketStatus.color} size="md" />
          {ticketStatus.name}
        </CardTitle>
        <Badge variant={active ? "secondary" : "outline"}>
          {active ? t("singular") : t("archived")}
        </Badge>
      </CardHeader>
      <CardContent className="grid gap-1 p-4 pt-0 text-sm text-muted-foreground">
        {set.length > 0 ? (
          <p className="text-foreground">{set.map((flag) => flags(flag)).join(", ")}</p>
        ) : null}
        <p>{t("transitions", { count: ticketStatus.transitionsTo.length })}</p>
        <Link href={ticketStatusesRoute()} className="text-primary hover:underline">
          {t("open")}
        </Link>
      </CardContent>
    </Card>
  );
}
