import type { SetupPreset } from "./setup-presets";

const book = ({ key, name }: { key: string; name: string }) => ({ key, name, bookable: true });
const sell = ({ key, name }: { key: string; name: string }) => ({ key, name, bookable: false });

const coffeeBreak = sell({ key: "coffeeBreak", name: "Coffee break" });
const drink = sell({ key: "drink", name: "Drink" });
const meal = sell({ key: "meal", name: "Meal" });
const meetingRoom = book({ key: "meetingRoom", name: "Meeting room" });
const equipment = book({ key: "equipment", name: "Equipment" });
const guide = book({ key: "guide", name: "Guide" });
const hall = book({ key: "hall", name: "Hall" });

/**
 * The venue kinds of the welcome flow (ADR 0061, `docs/specs/welcome.md`). `key` names the
 * i18n label (`welcome.types.<key>`); `name` is the English fallback. Domain words live only here.
 */
export const VENUE_KIND_PRESETS = {
  "conference-estate": {
    phases: "conference-estate",
    itemTypes: [
      book({ key: "conferenceRoom", name: "Conference room" }),
      book({ key: "breakoutRoom", name: "Breakout room" }),
      equipment,
      coffeeBreak,
      sell({ key: "lunch", name: "Lunch" }),
      sell({ key: "dinner", name: "Dinner" }),
      drink,
      sell({ key: "activity", name: "Activity" }),
    ],
  },
  "manor-house": {
    phases: "conference-estate",
    itemTypes: [
      book({ key: "banquetHall", name: "Banquet hall" }),
      meetingRoom,
      book({ key: "garden", name: "Garden" }),
      sell({ key: "dinnerMenu", name: "Dinner menu" }),
      sell({ key: "drinkPackage", name: "Drink package" }),
      coffeeBreak,
      sell({ key: "activity", name: "Activity" }),
    ],
  },
  "experience-centre": {
    phases: "conference-estate",
    itemTypes: [
      hall,
      guide,
      sell({ key: "tour", name: "Tour" }),
      sell({ key: "workshop", name: "Workshop" }),
      meal,
      drink,
    ],
  },
  museum: {
    phases: "default",
    itemTypes: [
      book({ key: "eventSpace", name: "Event space" }),
      guide,
      sell({ key: "guidedTour", name: "Guided tour" }),
      coffeeBreak,
      meal,
    ],
  },
  restaurant: {
    phases: "default",
    itemTypes: [
      book({ key: "privateRoom", name: "Private room" }),
      sell({ key: "setMenu", name: "Set menu" }),
      sell({ key: "dish", name: "Dish" }),
      drink,
      sell({ key: "winePackage", name: "Wine package" }),
    ],
  },
  "event-hall": {
    phases: "conference-estate",
    itemTypes: [
      hall,
      meetingRoom,
      book({ key: "exhibitionStand", name: "Exhibition stand" }),
      equipment,
      sell({ key: "catering", name: "Catering" }),
      coffeeBreak,
      drink,
    ],
  },
  "arena-hospitality": {
    phases: "default",
    itemTypes: [
      book({ key: "lodge", name: "Lodge" }),
      book({ key: "lounge", name: "Lounge" }),
      sell({ key: "matchDayPackage", name: "Match-day package" }),
      meal,
      drink,
    ],
  },
  theatre: {
    phases: "default",
    itemTypes: [
      book({ key: "foyer", name: "Foyer" }),
      book({ key: "rehearsalRoom", name: "Rehearsal room" }),
      sell({ key: "preShowDinner", name: "Pre-show dinner" }),
      drink,
      sell({ key: "intervalPackage", name: "Interval package" }),
    ],
  },
  "meeting-space": {
    phases: "default",
    itemTypes: [meetingRoom, equipment, coffeeBreak, sell({ key: "lunch", name: "Lunch" })],
  },
  empty: { phases: "default", itemTypes: [] },
} as const satisfies Record<string, Omit<SetupPreset, "key">>;
