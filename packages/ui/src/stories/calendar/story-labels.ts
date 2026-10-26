import type { CalendarLabels } from "../../components/availability-calendar/calendar-labels";
import { STORY_DAY, storyFormatDate } from "./story-dates";

const plural = ({ count, one, many }: { count: number; one: string; many: string }) =>
  `${count} ${count === 1 ? one : many}`;

/** The stories' English words; the app passes its translations. */
export const STORY_LABELS: CalendarLabels = {
  levels: { day: "Day", week: "Week", month: "Month", custom: "Custom" },
  range: "Range",
  earlier: "Earlier",
  today: "Today",
  later: "Later",
  customRange: "Custom range",
  firstDay: "First day",
  lastDay: "Last day",
  showRange: "Show range",
  jumpInTime: "Jump in time",
  search: "Search",
  searchPlaceholder: "Search assets, customers, tickets",
  searchLabel: "Search assets, customers and tickets",
  assetGroups: "Asset groups",
  allAssets: "All assets",
  groupCount: ({ count }) => `${count} groups`,
  searchGroups: "Search groups",
  noGroupMatch: "No group matches.",
  noMatch: ({ query, groups }) =>
    `Nothing matches “${query}”${groups.length === 0 ? "" : ` in ${groups.join(", ")}`}.`,
  addBooking: ({ asset }) => `Add a booking on ${asset}`,
  clash: ({ from, to }) => `Clash ${from}–${to}`,
  dayCell: ({ asset, day, percent, count, clash }) =>
    `${asset}, ${day}: ${
      count === 0
        ? "free"
        : `${percent}% booked, ${plural({ count, one: "booking", many: "bookings" })}`
    }${clash ? ", clash" : ""}`,
  openDay: ({ label }) => `${label}. Open the day`,
  client: "Client",
  internal: "Internal",
  blocked: "Blocked",
  notSold: "not sold",
  guests: ({ count }) => plural({ count, one: "guest", many: "guests" }),
  guestsHere: ({ count }) => (count ? `${count} guests here` : "Guests here"),
  guestsAt: ({ place }) => `Guests: ${place}`,
  lineCount: ({ count }) => plural({ count, one: "line", many: "lines" }),
  unscheduled: "Not scheduled",
  clock: ({ minutes }) =>
    `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`,
  hour: ({ hour }) => String(hour).padStart(2, "0"),
  money: ({ amount, currency }) =>
    new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency,
      currencyDisplay: "code",
      maximumFractionDigits: 0,
    }).format(amount),
  exclVat: ({ amount }) => `${amount} excl. VAT`,
  value: {
    booked: "Booked",
    prebooked: "Prebooked",
    open: "Still open",
    note: "Excl. VAT. Still open is free time in opening hours at hourly prices.",
    rate: ({ percent }) => `${percent}% booked`,
    share: ({ percent }) => `${percent}%`,
  },
  open: ({ ticket }) => `Open ${ticket}`,
  openLine: "Open line",
  notes: "Notes",
  staff: "Staff",
  fromTicket: ({ via }) => `${via}, from ticket`,
  holds: { hard: "hard hold, blocks", soft: "soft hold, may overlap", none: "no hold" },
  buffers: "Setup / teardown",
  buffersText: "space taken, not sold",
};

/** What the app passes the calendar, as the stories stand it in. */
export const STORY_CALENDAR = {
  today: STORY_DAY,
  locale: "en-GB",
  formatDate: storyFormatDate({ locale: "en-GB" }),
  labels: STORY_LABELS,
};
