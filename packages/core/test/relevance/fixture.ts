export type FixtureVenue = { key: string; name: string; description: string; city: string };
export type FixtureItem = { key: string; venue: string; name: string; description: string };
export type FixtureSkill = { key: string; name: string; description: string };

export const VENUES: readonly FixtureVenue[] = [
  {
    key: "harbour",
    name: "Hamnpaviljongen",
    description: "Conference estate by the harbour with sea view and a large banquet hall",
    city: "Goteborg",
  },
  {
    key: "museum",
    name: "Bilmuseet",
    description: "Experience centre and museum with exhibition halls and a rooftop restaurant",
    city: "Goteborg",
  },
  {
    key: "manor",
    name: "Ekeby herrgard",
    description: "Manor house in the countryside with overnight rooms and a garden terrace",
    city: "Uppsala",
  },
];

export const ITEMS: readonly FixtureItem[] = [
  {
    key: "boardroom",
    venue: "harbour",
    name: "Styrelserummet",
    description: "Boardroom for ten people with video conference equipment and daylight",
  },
  {
    key: "banquet",
    venue: "harbour",
    name: "Festsalen",
    description: "Banquet hall for large dinners, seats 200 guests, stage and dance floor",
  },
  {
    key: "workshop",
    venue: "museum",
    name: "Verkstadsrummet",
    description: "Workshop room with movable tables, whiteboards and projector for team days",
  },
  {
    key: "lunch",
    venue: "museum",
    name: "Lunchbuffe",
    description: "Lunch buffet with vegetarian and gluten free alternatives, served daily",
  },
  {
    key: "garden",
    venue: "manor",
    name: "Tradgardsterrassen",
    description: "Garden terrace for summer parties and wedding ceremonies outdoors",
  },
];

export const SKILLS: readonly FixtureSkill[] = [
  {
    key: "kitchen-order",
    name: "Kitchen order",
    description: "Compile allergens and dietary needs into an order sheet for the kitchen",
  },
  {
    key: "quote",
    name: "Conference quote",
    description: "Calculate a price for a conference day with room hire and catering",
  },
];

export type RelevanceQuery = {
  query: string;
  /** Fixture key of the entity that must rank in the top `TOP_N`. */
  expect: string;
  /** Needs real embeddings (no shared words with the target); only asserted with a real model. */
  semantic?: boolean;
};

export const QUERIES: readonly RelevanceQuery[] = [
  { query: "boardroom video conference", expect: "boardroom" },
  { query: "styrelserummet", expect: "boardroom" },
  { query: "banquet hall dinner for 200", expect: "banquet" },
  { query: "festsalen", expect: "banquet" },
  { query: "vegetarian lunch gluten free", expect: "lunch" },
  { query: "workshop projector whiteboard", expect: "workshop" },
  { query: "wedding ceremony outdoors", expect: "garden" },
  { query: "manor house overnight rooms", expect: "manor" },
  { query: "museum rooftop restaurant", expect: "museum" },
  { query: "allergens order sheet kitchen", expect: "kitchen-order" },
  { query: "price conference day catering", expect: "quote" },
  { query: "mote med videolank", expect: "boardroom", semantic: true },
  { query: "bröllop i tradgarden", expect: "garden", semantic: true },
  { query: "mat for vegetarianer", expect: "lunch", semantic: true },
  { query: "offert for konferens", expect: "quote", semantic: true },
];

/** An expected hit must be within this many results (documented in docs/search-relevance.md). */
export const TOP_N = 3;
