"use client";

import { Badge, Card, CardContent, CardHeader, CardTitle } from "@bibi/ui";
import { ArrowRightIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Fragment } from "react";
import type { GenerativeProps } from "./generative-props";

export type PipelineDraftCardViewProps = GenerativeProps<"pipeline-draft-card">;

/**
 * A setup draft in plain words (ADR 0045): what the organization sells and how a request moves.
 * No states, holds or grid: those are set by the draft without the user having to see them.
 */
export function PipelineDraftCardView({ draft }: PipelineDraftCardViewProps) {
  const t = useTranslations("assistant.ui.pipelineDraft");
  const open = draft.statuses.filter((ticketStatus) => !ticketStatus.closes);
  const ends = draft.statuses.filter((ticketStatus) => ticketStatus.closes);
  return (
    <Card data-slot="pipeline-draft-card" className="gap-3 py-4 shadow-none">
      <CardHeader className="px-4">
        <CardTitle className="text-sm">{t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 px-4 text-sm">
        <section className="grid gap-1.5">
          <h4 className="text-xs font-medium text-muted-foreground">{t("sell")}</h4>
          <div className="flex flex-wrap gap-1.5">
            {draft.itemTypes.length === 0 ? <span>{t("nothingYet")}</span> : null}
            {draft.itemTypes.map((type) => (
              <Badge key={type.name} variant="secondary">
                {type.name}
              </Badge>
            ))}
          </div>
        </section>
        <section className="grid gap-1.5">
          <h4 className="text-xs font-medium text-muted-foreground">{t("moves")}</h4>
          <div className="flex flex-wrap items-center gap-1.5">
            {open.map((ticketStatus, index) => (
              <Fragment key={ticketStatus.name}>
                {index > 0 ? <ArrowRightIcon className="size-3 text-muted-foreground" /> : null}
                <Badge variant="outline">{ticketStatus.name}</Badge>
              </Fragment>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            {t("ends", { statuses: ends.map((ticketStatus) => ticketStatus.name).join(", ") })}
          </p>
        </section>
      </CardContent>
    </Card>
  );
}
