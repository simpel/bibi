import "server-only";
import { listItems, listSetups, type Result } from "@okazi/core";
import { runOperation } from "@/server/run-operation";
import { loadBookingData } from "../booking/load-booking-data";
import type { SeriesFormData } from "./ui/series-form-data";

const LIMIT = 100;

/** The booking data plus the bookable items and the setups a series can use (one page each). */
export async function loadSeriesData(): Promise<Result<SeriesFormData>> {
  const [booking, items, setups] = await Promise.all([
    loadBookingData(),
    runOperation({ operation: listItems, input: { behaviour: "BOOKABLE", limit: LIMIT } }),
    runOperation({ operation: listSetups, input: { limit: LIMIT } }),
  ]);
  if (!booking.ok) return booking;
  if (!items.ok) return items;
  if (!setups.ok) return setups;
  const named = ({ id, name }: { id: string; name: string }) => ({ id, name });
  return {
    ok: true,
    value: {
      ...booking.value,
      rooms: items.value.items.map(named),
      setups: setups.value.items.map(named),
    },
  };
}
