import type { SetupPreset } from "./setup-presets";

const space = ({ key, name }: { key: string; name: string }) => ({
  key,
  name,
  bookable: true,
  category: "spaces" as const,
});
const food = ({ key, name }: { key: string; name: string }) => ({
  key,
  name,
  bookable: false,
  category: "food" as const,
});
const extra = ({
  key,
  name,
  bookable = false,
}: {
  key: string;
  name: string;
  bookable?: boolean;
}) => ({
  key,
  name,
  bookable,
  category: "extras" as const,
});

const coffeeBreak = food({ key: "coffeeBreak", name: "Coffee break" });
const drink = food({ key: "drink", name: "Drink" });
const meal = food({ key: "meal", name: "Meal" });
const meetingRoom = space({ key: "meetingRoom", name: "Meeting room" });
const equipment = extra({ key: "equipment", name: "Equipment", bookable: true });
const guide = extra({ key: "guide", name: "Guide", bookable: true });
const hall = space({ key: "hall", name: "Hall" });

/**
 * The venue kinds of the welcome flow (ADR 0061, `docs/specs/welcome.md`). `key` names the
 * i18n label (`welcome.types.<key>`); `name` is the English fallback. Domain words live only here.
 */
export const VENUE_KIND_PRESETS = {
  "conference-estate": {
    statuses: "conference-estate",
    itemTypes: [
      space({ key: "conferenceRoom", name: "Conference room" }),
      space({ key: "breakoutRoom", name: "Breakout room" }),
      equipment,
      coffeeBreak,
      food({ key: "lunch", name: "Lunch" }),
      food({ key: "dinner", name: "Dinner" }),
      drink,
      extra({ key: "activity", name: "Activity" }),
    ],
  },
  "manor-house": {
    statuses: "conference-estate",
    itemTypes: [
      space({ key: "banquetHall", name: "Banquet hall" }),
      meetingRoom,
      space({ key: "garden", name: "Garden" }),
      food({ key: "dinnerMenu", name: "Dinner menu" }),
      food({ key: "drinkPackage", name: "Drink package" }),
      coffeeBreak,
      extra({ key: "activity", name: "Activity" }),
    ],
  },
  "experience-centre": {
    statuses: "conference-estate",
    itemTypes: [
      hall,
      guide,
      extra({ key: "tour", name: "Tour" }),
      extra({ key: "workshop", name: "Workshop" }),
      meal,
      drink,
    ],
  },
  museum: {
    statuses: "default",
    itemTypes: [
      space({ key: "eventSpace", name: "Event space" }),
      guide,
      extra({ key: "guidedTour", name: "Guided tour" }),
      coffeeBreak,
      meal,
    ],
  },
  restaurant: {
    statuses: "default",
    itemTypes: [
      space({ key: "privateRoom", name: "Private room" }),
      food({ key: "setMenu", name: "Set menu" }),
      food({ key: "dish", name: "Dish" }),
      drink,
      food({ key: "winePackage", name: "Wine package" }),
    ],
  },
  "event-hall": {
    statuses: "conference-estate",
    itemTypes: [
      hall,
      meetingRoom,
      space({ key: "exhibitionStand", name: "Exhibition stand" }),
      equipment,
      food({ key: "catering", name: "Catering" }),
      coffeeBreak,
      drink,
    ],
  },
  "arena-hospitality": {
    statuses: "default",
    itemTypes: [
      space({ key: "lodge", name: "Lodge" }),
      space({ key: "lounge", name: "Lounge" }),
      food({ key: "matchDayPackage", name: "Match-day package" }),
      meal,
      drink,
    ],
  },
  theatre: {
    statuses: "default",
    itemTypes: [
      space({ key: "foyer", name: "Foyer" }),
      space({ key: "rehearsalRoom", name: "Rehearsal room" }),
      food({ key: "preShowDinner", name: "Pre-show dinner" }),
      drink,
      food({ key: "intervalPackage", name: "Interval package" }),
    ],
  },
  "meeting-space": {
    statuses: "default",
    itemTypes: [meetingRoom, equipment, coffeeBreak, food({ key: "lunch", name: "Lunch" })],
  },
  empty: { statuses: "default", itemTypes: [] },
} as const satisfies Record<string, Omit<SetupPreset, "key">>;
