import type { BookingSeriesDto } from "@okazi/core";
import { TriangleAlertIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";

export type SeriesNoticesProps = { series: BookingSeriesDto };

/** Notes above the occurrences: clashes to resolve, a cancellation and a truncated rule. */
export async function SeriesNotices({ series }: SeriesNoticesProps) {
  const t = await getTranslations("bookingSeries");
  const { clashes, truncated, cancelledAt, cancellationReason } = series;
  return (
    <>
      {clashes.length > 0 && !cancelledAt ? (
        <p role="status" className="flex items-center gap-2 text-sm">
          <TriangleAlertIcon className="size-4 text-warning" />
          {t("clashNotice", { count: clashes.length })}
        </p>
      ) : null}
      {cancelledAt ? (
        <p role="status" className="text-sm">
          {t("cancelledNotice", { reason: cancellationReason ?? "" })}
        </p>
      ) : null}
      {truncated ? <p className="text-sm text-muted-foreground">{t("truncated")}</p> : null}
    </>
  );
}
