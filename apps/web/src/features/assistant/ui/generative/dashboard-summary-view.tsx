"use client";

import { Card } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { AttentionPanel } from "@/features/dashboard/ui/attention-panel";
import { PipelineTiles } from "@/features/dashboard/ui/pipeline-tiles";
import { Link } from "@/lib/navigation";
import { useNumberFormat } from "@/lib/number/use-number-format";
import { ROUTES } from "@/lib/routes";
import { useDateTimeFormat } from "@/lib/time/use-date-time-format";
import type { GenerativeProps } from "./generative-props";

export type DashboardSummaryViewProps = GenerativeProps<"dashboard-summary">;

/** Open tickets per status and what needs attention; the page has the weeks ahead. */
export function DashboardSummaryView({ summary }: DashboardSummaryViewProps) {
  const t = useTranslations("dashboard");
  const numbers = useNumberFormat();
  const dates = useDateTimeFormat();
  return (
    <Card data-slot="dashboard-summary" className="grid gap-3 p-4 shadow-none">
      <PipelineTiles statuses={summary.statuses} currency={summary.currency} numbers={numbers} />
      <AttentionPanel summary={summary} dates={dates} numbers={numbers} />
      <Link href={ROUTES.dashboard} className="text-sm font-medium hover:underline">
        {t("title")}
      </Link>
    </Card>
  );
}
