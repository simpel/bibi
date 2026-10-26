import type { DemoDensity, DensityShape, DensityStatus } from "../../density-types";

const confirmed: DensityStatus = { status: "Confirmed", quote: "Conference lunch" };
const quoteSent: DensityStatus = { status: "Quote sent", quote: "Conference lunch" };
/** Leads further out: New (no move), a site visit, a sent quote, or already confirmed. */
const FAR: readonly DensityStatus[] = [{}, { status: "Site visit" }, quoteSent, confirmed];

/** Who works the tickets, in turn: the coordinators and sellers, with a seller following. */
const PEOPLE: readonly Pick<DensityShape, "assignee" | "followers">[] = [
  { assignee: "Maria Holm", followers: ["Sara Nilsson"] },
  { assignee: "Johan Ek", followers: ["Erik Lund"] },
  { assignee: "Sara Nilsson" },
  { assignee: "Erik Lund", followers: ["Lena Strand"] },
  { assignee: "Lena Strand" },
];

type ConferenceInput = { customer: string; purpose: string; headcount: number };

const conference = ({
  customer,
  purpose,
  headcount,
  index,
}: ConferenceInput & { index: number }) => ({
  ...{ customer, headcount, type: "Conference", label: purpose, fields: { Purpose: purpose } },
  ...(PEOPLE[index % PEOPLE.length] as (typeof PEOPLE)[number]),
});

/**
 * Lindholmen's busy weeks (#488): 2–5 room blocks on weekdays, at most one on Saturday and none
 * on Sunday (the venue is closed), up to three rooms per ticket (a plenary and breakouts).
 * Until D+14 nearly every ticket is Confirmed through an accepted quote, so its rooms are hard
 * holds; further out they spread over New, Site visit, Quote sent and Confirmed.
 */
export const lindholmenDensity: DemoDensity = {
  prefix: "G",
  timeZone: "Europe/Stockholm",
  ...{ fromDay: -7, toDay: 30, perTicket: 3, rotateSlots: true },
  perWeekday: [
    [2, 5],
    [2, 5],
    [2, 5],
    [2, 5],
    [2, 4],
    [0, 1],
    [0, 0],
  ],
  assets: [
    ...["Vinga (auditorium)", "Hönö", "Öckerö", "Styrsö", "Vrångö", "Donsö", "Brännö"],
    ...["Asperö", "Knippla (workshop)", "The View (roof terrace)"],
  ],
  slots: [
    { from: "08:30", to: "12:00" },
    { from: "13:00", to: "17:00" },
    { from: "09:00", to: "16:00" },
    { from: "10:00", to: "12:00" },
    { from: "14:00", to: "16:30" },
    { from: "17:30", to: "21:30" },
    { from: "08:00", to: "10:00" },
  ],
  shapes: (
    [
      { customer: "Hisingen Energi AB", purpose: "Sales kickoff", headcount: 30 },
      { customer: "Nordkust Logistik AB", purpose: "Management team", headcount: 12 },
      { customer: "Västra Sjukvårdsregionen", purpose: "Training day", headcount: 40 },
      { customer: "Kvarnby Design AB", purpose: "Design sprint", headcount: 16 },
      { customer: "Göta Advokatbyrå KB", purpose: "Partner meeting", headcount: 10 },
      { customer: "Älvstrand Tech AB", purpose: "Hackathon", headcount: 50 },
      { customer: "Göteborgs Seglarsällskap", purpose: "Board meeting", headcount: 8 },
    ] satisfies ConferenceInput[]
  ).map((input, index) => conference({ ...input, index })),
  statusOf: ({ day, index }) =>
    day <= 14 ? (index % 5 === 4 ? quoteSent : confirmed) : (FAR[index % FAR.length] ?? {}),
};
