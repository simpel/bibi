"use client";

import { PHASE_FLAGS } from "@okazi/core/schemas";
import { Link } from "@okazi/i18n/navigation";
import { Badge, Card, CardContent, CardHeader, CardTitle, ColorSwatch } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { ticketPhasesRoute } from "@/lib/configuration-routes";
import type { GenerativeProps } from "./generative-props";

export type TicketPhaseCardViewProps = GenerativeProps<"ticket-phase-card">;

/** One ticket phase: color, flags and how many phases it may move to. */
export function TicketPhaseCardView({ phase }: TicketPhaseCardViewProps) {
  const t = useTranslations("assistant.ui.ticketPhase");
  const flags = useTranslations("ticketPhase.flags");
  const active = phase.status === "ACTIVE";
  const set = PHASE_FLAGS.filter((flag) => phase[flag]);
  return (
    <Card data-slot="ticket-phase-card" className="shadow-none">
      <CardHeader className="flex-row items-start justify-between gap-2 p-4 pb-2">
        <CardTitle className="inline-flex items-center gap-2 text-base">
          <ColorSwatch color={phase.color} size="md" />
          {phase.name}
        </CardTitle>
        <Badge variant={active ? "secondary" : "outline"}>
          {active ? t("singular") : t("archived")}
        </Badge>
      </CardHeader>
      <CardContent className="grid gap-1 p-4 pt-0 text-sm text-muted-foreground">
        {set.length > 0 ? (
          <p className="text-foreground">{set.map((flag) => flags(flag)).join(", ")}</p>
        ) : null}
        <p>{t("transitions", { count: phase.transitionsTo.length })}</p>
        <Link href={ticketPhasesRoute()} className="text-primary hover:underline">
          {t("open")}
        </Link>
      </CardContent>
    </Card>
  );
}
