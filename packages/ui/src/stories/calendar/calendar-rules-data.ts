/** The calendar design language as data, rendered by the Overview story. */

export const PRINCIPLES: readonly { title: string; body: string }[] = [
  {
    title: "Pick by question, not by screen",
    body: "Each component answers one question. Use the one whose question the reader has; never two that answer the same thing on one screen.",
  },
  {
    title: "One symbol, one meaning",
    body: "Hue is the state's stage and nothing else: amber tentative, blue ordered, green confirmed, set by the state's stage, never a free color. Fill and edge are the hold. Grey fill is blocked but not sold; grey lines are structure; ink marks focus. Brand color never appears inside a calendar. The full list is the Symbols story.",
  },
  {
    title: "States pick a stage, not a color",
    body: "An organization names its states freely but gives each one a stage from a fixed palette: tentative, ordered or confirmed. The stage decides the hue in every calendar, list and card, so Prebooked can never be green in one organization and amber in another. Released states are never drawn. Hold stays its own setting and decides the fill.",
  },
  {
    title: "Buffers attach, never blend",
    body: "Setup and teardown sit flush against their booking, thinner, faint and dotted in the same color. They are time the space is taken, not time that was sold, so they never change the booking's own times.",
  },
  {
    title: "Audience is a prop, not a fork",
    body: "Every component takes audience. External drops holds, states, buffers, people and the legend, and draws every line as a white card with an ink edge. Same layout, less information.",
  },
  {
    title: "Marks stay quiet, details on hover",
    body: "A mark carries its name and time, nothing more. One hover card holds the rest, the same in every component: the title with one primary action, Open line, beside it; staff notes; the contact (name and number) at the foot. The card opens things, never changes them: changes happen on the line itself. State, time, buffers, guests and staffing are already drawn, so the card never repeats them. It opens on hover, focus or tap. Tracks (lanes, day column, availability) show no people; the agenda, a list, shows the contact and staff inline. Customers' cards show title and time only.",
  },
  {
    title: "Follow the guests",
    body: "Every calendar shows where the guests are. A line either has guests (rooms, meals, activities) or not (staff, equipment); a bundle only frames. At any moment the guests are in one place: where guest lines overlap the shortest wins, so lunch at the Restaurant beats the all-day room. The path is a solid ink rule, never a hue: the Guests lane in lanes, a rail in the day column. Lines with guests carry the people mark. Availability answers what is free, so it shows neither.",
  },
  {
    title: "Overview first, detail on click",
    body: "Availability is the overview: one question, what is free. Blocks say who (the customer) and when; no guests, headcounts or people marks, and nothing ever fades. Clicking a booking opens its ticket's Program (lanes) beside it, with the booking ringed behind. Empty time is the add button: point to see a dashed slot, click to book. Where two lines on one asset take the same time, buffers included, the shared stretch gets a red ground behind both bookings, notched on top; red means that and nothing else. Design for the worst case: dozens of assets in the organization's own groups, filtered by chips and search, with hours and names pinned.",
  },
  {
    title: "Phones are first-class",
    body: "Staff on the move check the day on a phone. Every component works at 375px: lanes stack the name above a full-width track, the day column is the phone view of one ticket, availability pins asset names and hours and scrolls both ways, with group chips that scroll on their own. Details open on tap, since touch has no hover.",
  },
  {
    title: "The axis fits the day",
    body: "24-hour, tabular figures, rounded out to whole hours around the content and the venue's opening hours. Never 00–24 by default. Times are the venue's zone (ADR 0064).",
  },
  {
    title: "Staff see who to call; customers see no one",
    body: "Internally every line has exactly one contact: its assignee, a responsibility's holder (Head of kitchen) or, failing both, the ticket's assignee, marked \"from ticket\". The contact shows with name, why them and the number; staff who work the line show as name and role. Externally calendars show no people: the point of contact belongs to the page around the calendar, not to its lines.",
  },
  {
    title: "A bundle frames, its parts are scheduled",
    body: "The package names the day (agenda heading, lanes parent row, day band). Parts carry the times.",
  },
];

export type UsageRow = {
  component: string;
  question: string;
  internal: string;
  external: string;
};

export const USAGE: readonly UsageRow[] = [
  {
    component: "Date leaf",
    question: "When is it?",
    internal: "sm: ticket header, ticket lists, pipeline cards",
    external: "md with year: payment page, quote PDF, confirmation email",
  },
  {
    component: "Agenda",
    question: "What happens, in order?",
    internal: "Ticket summary with contacts; state and buffers in the hover card",
    external: "Payment page and quote: the customer's program",
  },
  {
    component: "Lanes",
    question: "How do this ticket's lines overlap?",
    internal: "Ticket Program section; stacks on phones",
    external: "Quote for multi-room or multi-part days only",
  },
  {
    component: "Day column",
    question: "What does the day look like hour by hour?",
    internal: "Phone, day-of run sheet, kitchen and AV sheets",
    external: "Printed program on the day (optional)",
  },
  {
    component: "Availability",
    question: "What is free, and what is taken, across everything we book?",
    internal:
      "The main calendar and the overview: assets in the organization's groups, filter and search, click empty time to add, click a booking to open its ticket's Program",
    external: "Never: it shows other customers",
  },
];
