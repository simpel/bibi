import { Link } from "@okazi/i18n/navigation";
import { badgeVariants } from "@okazi/ui";
import { getTranslations } from "next-intl/server";
import { bookingSeriesRoute } from "@/lib/routes";
import { loadSeriesTotals } from "../load-series-totals";

export type SeriesMarkerProps = {
  seriesId: string | null;
  index: number | null;
  total?: number | undefined;
};

/** "Series 3/10" linking to the series; nothing for a booking outside a series. */
export async function SeriesMarker({ seriesId, index, total }: SeriesMarkerProps) {
  if (!seriesId || index === null) return null;
  const t = await getTranslations("bookingSeries");
  const label = total ? t("marker", { index, total }) : t("markerNoTotal", { index });
  return (
    <Link
      href={bookingSeriesRoute({ id: seriesId })}
      className={badgeVariants({ variant: "outline" })}
    >
      {label}
    </Link>
  );
}

/** The marker with the series total, loaded for a single booking (detail page). */
export async function BookingSeriesMarker({ seriesId, index }: Omit<SeriesMarkerProps, "total">) {
  const total = seriesId ? (await loadSeriesTotals()).get(seriesId) : undefined;
  return <SeriesMarker seriesId={seriesId} index={index} total={total} />;
}
