import type {
  AssetBooking,
  CalendarAsset,
} from "../../components/availability-calendar/calendar-types";
import type { CalendarDayValue } from "../../components/availability-calendar/day-value";

/** An hourly price per asset, made up from its id, for rooms only (equipment is priced flat). */
const hourlyOf = ({ asset }: { asset: CalendarAsset }) =>
  asset.person ? 0 : 900 + ([...asset.id].reduce((sum, c) => sum + c.charCodeAt(0), 0) % 8) * 150;

const hoursOf = ({ booking }: { booking: AssetBooking }) => {
  const [sh = 0, sm = 0] = booking.start.split(":").map(Number);
  const [eh = 0, em = 0] = booking.end.split(":").map(Number);
  return Math.max(0, eh + em / 60 - (sh + sm / 60));
};

/** What the app would load: booked and prebooked from the bookings, open from a 10 hour day. */
export function storyValues({
  assets,
  bookings,
}: {
  assets: readonly CalendarAsset[];
  bookings: readonly AssetBooking[];
}): CalendarDayValue[] {
  const dates = [...new Set(bookings.map((booking) => booking.date))];
  return assets.flatMap((asset) => {
    const hourly = hourlyOf({ asset });
    if (hourly === 0) return [];
    return dates.map((date) => {
      const own = bookings.filter((b) => b.assetId === asset.id && b.date === date && b.ticket);
      const sum = ({ hold }: { hold: "hard" | "soft" }) =>
        own
          .filter((b) => b.state.hold === hold)
          .reduce((total, b) => total + (b.value?.amount ?? hoursOf({ booking: b }) * hourly), 0);
      const taken = own.reduce((total, b) => total + hoursOf({ booking: b }), 0);
      const open = Math.max(0, 10 - taken) * hourly;
      return {
        ...{ assetId: asset.id, date, currency: "SEK" },
        ...{ booked: sum({ hold: "hard" }), prebooked: sum({ hold: "soft" }), open },
      };
    });
  });
}
