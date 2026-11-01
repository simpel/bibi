"use client";

import { Card } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { AttentionPanel } from "@/features/dashboard/ui/attention-panel";
import { StatusStatCards } from "@/features/dashboard/ui/status-stat-cards";
import { Link } from "@/lib/navigation";
import { useNumberFormat } from "@/lib/number/use-number-format";
import { ROUTES } from "@/lib/routes";
import { useDateTimeFormat } from "@/lib/time/use-date-time-format";
import type { GenerativeProps } from "./generative-props";

export type DashboardSummaryViewProps = GenerativeProps<"dashboard-summary">;

/** A stat card per open status and what needs attention; the Workload tab has the rest. */
export function DashboardSummaryView({ summary }: DashboardSummaryViewProps) {
  const t = useTranslations("dashboard");
  const numbers = useNumberFormat();
  const dates = useDateTimeFormat();
  return (
    <Card data-slot="dashboard-summary" className="grid gap-3 p-4 shadow-none">
      <StatusStatCards summary={summary} dates={dates} numbers={numbers} />
      <AttentionPanel summary={summary} dates={dates} numbers={numbers} />
      <Link href={ROUTES.workload} className="text-sm font-medium hover:underline">
        {t("title")}
      </Link>
    </Card>
  );
}
