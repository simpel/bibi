import { loadSeriesTotals } from "../load-series-totals";
import { SeriesMarker, type SeriesMarkerProps } from "./series-marker";

/** The marker with the series total, loaded for a single booking (detail page). */
export async function BookingSeriesMarker({ seriesId, index }: Omit<SeriesMarkerProps, "total">) {
  const total = seriesId ? (await loadSeriesTotals()).get(seriesId) : undefined;
  return <SeriesMarker seriesId={seriesId} index={index} total={total} />;
}
