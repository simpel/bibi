import type { DemoChoice, DemoLine } from "../../ticket-types";

/**
 * L9's team dinner for 14 (ADR 0082): the main course is split between the guests, 10 venison and
 * 4 celeriac steak, with one starter and one dessert for everyone. The two main courses get a
 * price of 0 kr on the line, so the quote lists them (included, not counted) and freezes both.
 */
export const l9Lines: readonly DemoLine[] = [
  {
    ...{ item: "Three-course dinner", name: "Team dinner", from: "17:00", to: "20:00" },
    quantity: 14,
    options: [
      { name: "Beetroot carpaccio with chèvre" },
      { name: "Venison fillet, celeriac purée", quantity: 10, unitPriceKr: 0 },
      { name: "Celeriac steak, mustard vinaigrette", quantity: 4, unitPriceKr: 0 },
      { name: "Cloudberry parfait" },
    ],
  },
];

/**
 * ADR 0055: the only stored responsibility choices of Lindholmen's tickets (on L11). Head of
 * kitchen answers as Johan instead of the default Ali, and Maria leaves Coordinator's default
 * followers. Every other ticket follows the defaults.
 */
export const l11Choices: readonly DemoChoice[] = [
  { responsibility: "Head of kitchen", assignee: "Johan Ek" },
  { responsibility: "Coordinator", unfollow: "Maria Holm" },
];

/**
 * L4's lines: the room, a sound system that brings a technician from the pool of two for its
 * setup and teardown (ADR 0059, check 15), and a morning coffee whose snack the customer has not
 * chosen yet (ADR 0089: the line warns UNCHOSEN_REQUIRED_GROUP). Kept here so `tickets.ts` fits.
 */
export const l4Lines: readonly DemoLine[] = [
  { item: "Styrsö", name: "Half-day conference", from: "09:00", to: "13:00" },
  { item: "Mobile sound system", name: "Sound for the conference", from: "09:00", to: "13:00" },
  { item: "Morning break", name: "Morning coffee", from: "10:30", to: "10:50" },
];

/**
 * L11's lines. ADR 0052: an agreed room price (950 kr in the item) and a flat fee without a time.
 * ADR 0088: the board meeting has a projector add-on for the morning only, and the break buffet
 * picks Carrot cake in its Snack group (choose 1) with Oat ball and Fresh fruit as add-ons at
 * their own line price (dishes have none); the quote lists them under their lines. ADR 0082: the
 * board lunch splits its main course between the ten guests, 7 cod and 3 risotto, at 0 kr on
 * the line so the quote freezes both (as L9).
 */
export const l11Lines: readonly DemoLine[] = [
  {
    ...{ item: "Styrsö", name: "Board meeting", from: "09:00", to: "12:00", unitPriceKr: 800 },
    addOns: [
      {
        ...{ item: "Projector", name: "Projector for the morning", quantity: 1 },
        ...{ from: "09:00", to: "10:30" },
      },
    ],
  },
  { item: "Projector", name: "Projector hire", quantity: 1 },
  {
    ...{ item: "Afternoon break", name: "Break buffet", from: "10:30", to: "10:50" },
    options: [{ name: "Carrot cake" }],
    addOns: [
      { item: "Oat ball", name: "Oat ball", unitPriceKr: 25 },
      { item: "Fresh fruit", name: "Fresh fruit", unitPriceKr: 20 },
    ],
  },
  {
    ...{ item: "Conference lunch", name: "Board lunch", from: "12:00", to: "13:00" },
    state: "Locked",
    options: [
      { name: "Oven-baked cod loin, browned butter", quantity: 7, unitPriceKr: 0 },
      { name: "Mushroom risotto", quantity: 3, unitPriceKr: 0 },
    ],
  },
];
