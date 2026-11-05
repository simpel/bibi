"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { RunSheetMatches } from "@/features/run-sheet/ui/run-sheet-matches";
import { RunSheetRowsView } from "@/features/run-sheet/ui/run-sheet-rows-view";
import { RunSheetStatus } from "@/features/run-sheet/ui/run-sheet-status";
import { Link } from "@/lib/navigation";
import { orderRoute } from "@/lib/routes";
import { useDateTimeFormat } from "@/lib/time/use-date-time-format";
import type { GenerativeProps } from "./generative-props";

export type RunSheetCardViewProps = GenerativeProps<"run-sheet-card">;

/** One run sheet version: its status, the rows and the ★ changes since the last sent version. */
export function RunSheetCardView({ runSheet }: RunSheetCardViewProps) {
  const dates = useDateTimeFormat();
  const t = useTranslations("assistant.ui.runSheet");
  return (
    <Card data-slot="run-sheet-card" className="shadow-none">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-base">{t("singular")}</CardTitle>
        <RunSheetStatus dates={dates} runSheet={runSheet} />
      </CardHeader>
      <CardContent className="grid gap-2 p-4 pt-0">
        <RunSheetMatches matches={runSheet.matches} />
        <RunSheetRowsView dates={dates} content={runSheet.content} changes={runSheet.changes} />
        <Link
          href={orderRoute({ id: runSheet.orderId })}
          className="text-sm text-primary hover:underline"
        >
          {t("openOrder")}
        </Link>
      </CardContent>
    </Card>
  );
}
