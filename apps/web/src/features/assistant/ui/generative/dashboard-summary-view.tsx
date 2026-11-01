"use client";

import { Card } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { OutcomesPanel } from "@/features/dashboard/ui/outcomes-panel";
import { PipelineTiles } from "@/features/dashboard/ui/pipeline-tiles";
import { Link } from "@/lib/navigation";
import { useNumberFormat } from "@/lib/number/use-number-format";
import { ROUTES } from "@/lib/routes";
import type { GenerativeProps } from "./generative-props";

export type DashboardSummaryViewProps = GenerativeProps<"dashboard-summary">;

/** Open tickets per status and won against lost per month; the page has utilisation and money. */
export function DashboardSummaryView({ summary }: DashboardSummaryViewProps) {
  const t = useTranslations("dashboard");
  const numbers = useNumberFormat();
  const { statuses, outcomes, currency } = summary;
  return (
    <Card data-slot="dashboard-summary" className="grid gap-3 p-4 shadow-none">
      <PipelineTiles statuses={statuses} currency={currency} numbers={numbers} />
      {outcomes ? (
        <OutcomesPanel outcomes={outcomes} currency={currency} numbers={numbers} />
      ) : null}
      <Link href={ROUTES.dashboard} className="text-sm font-medium hover:underline">
        {t("title")}
      </Link>
    </Card>
  );
}
