import { Link } from "@okazi/i18n/navigation";
import { badgeVariants } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { bookingSeriesRoute } from "@/lib/routes";

export type SeriesMarkerProps = {
  seriesId: string | null;
  index: number | null;
  total?: number | undefined;
};

/** "Series 3/10" linking to the series; nothing for a booking outside a series. */
export function SeriesMarker({ seriesId, index, total }: SeriesMarkerProps) {
  const t = useTranslations("bookingSeries");
  if (!seriesId || index === null) return null;
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
