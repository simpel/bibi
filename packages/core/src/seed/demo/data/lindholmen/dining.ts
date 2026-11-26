import type { DemoDining, DemoFloorPiece, DemoFloorPlan, DemoItem } from "../../config-types";

const KAJEN = "Kajen";
const round = "Round table Ø150";
const rect = "Table 120 × 60";
const long = "Table 180 × 80";

/** The restaurant room: a conference room type with setups, drawn for table booking (ADR 0119). */
export const kajenRoom: DemoItem = {
  type: "Conference room",
  name: KAJEN,
  fields: { Floor: 1, "Area m²": 240, Daylight: true, View: "River" },
  maxPeople: 60,
  priceKr: 1200,
  priceUnit: "PER_HOUR",
};

const twoSeat = ({ label, x, y, online = true }: PieceInput): DemoFloorPiece => ({
  ...{ kind: round, x, y, label, seats: 2, widthCm: 80, depthCm: 80 },
  ...{ minCovers: 1, maxCovers: 2, onlineBookable: online },
});
const fourSeat = ({ label, x, y }: PieceInput): DemoFloorPiece => ({
  ...{ kind: rect, x, y, label, seatsTop: 2, seatsBottom: 2 },
  ...{ minCovers: 2, maxCovers: 4 },
});
const sixSeat = ({ label, x, y }: PieceInput): DemoFloorPiece => ({
  ...{ kind: long, x, y, label },
  ...{ minCovers: 4, maxCovers: 6 },
});

type PieceInput = { label: string; x: number; y: number; online?: boolean };

/** 14 tables in a 20 × 12 m room: 2-seat rounds along the windows, 4-seaters, two 6-seaters. */
const dinnerTables: readonly DemoFloorPiece[] = [
  twoSeat({ label: "11", x: 250, y: 150, online: false }),
  twoSeat({ label: "12", x: 450, y: 150, online: false }),
  twoSeat({ label: "1", x: 650, y: 150 }),
  twoSeat({ label: "2", x: 850, y: 150 }),
  twoSeat({ label: "3", x: 1050, y: 150 }),
  fourSeat({ label: "4", x: 300, y: 450 }),
  fourSeat({ label: "5", x: 600, y: 450 }),
  fourSeat({ label: "6", x: 900, y: 450 }),
  fourSeat({ label: "13", x: 1300, y: 450 }),
  fourSeat({ label: "14", x: 1600, y: 450 }),
  sixSeat({ label: "7", x: 400, y: 800 }),
  sixSeat({ label: "8", x: 600, y: 800 }),
  fourSeat({ label: "9", x: 1000, y: 800 }),
  fourSeat({ label: "10", x: 1300, y: 800 }),
];

export const kajenFloorPlan: DemoFloorPlan = {
  item: KAJEN,
  widthCm: 2000,
  depthCm: 1200,
  fixed: [
    { kind: "Window", x: 450, y: 0 },
    { kind: "Window", x: 1050, y: 0 },
    { kind: "Door", x: 1850, y: 1200, emergencyExit: true },
  ],
  layouts: [{ name: "Dinner", pieces: dinnerTables, useSeats: true }],
};

/** Rooms for the restaurant, seeded in the catalog (`docs/demo-seed.md`, Restaurant). */
const guests: DemoDining["guests"] = [
  { name: "Andersson", phone: "+46 70 111 22 01" },
  { name: "Bergström", phone: "+46 70 111 22 02" },
  { name: "Carlsson", phone: "+46 70 111 22 03" },
  { name: "Dahl", phone: "+46 70 111 22 04" },
  { name: "Eriksson", phone: "+46 70 111 22 05" },
  { name: "Forsberg", phone: "+46 70 111 22 06" },
  { name: "Gustafsson", phone: "+46 70 111 22 07" },
  { name: "Holmgren", phone: "+46 70 111 22 08" },
  { name: "Isaksson", phone: "+46 70 111 22 09" },
  { name: "Johansson", phone: "+46 70 111 22 10" },
];

const needs: DemoDining["needs"] = [
  { list: "Allergens", value: "Gluten" },
  { list: "Allergens", value: "Milk" },
  { list: "Allergens", value: "Peanuts" },
];

const kajenDining: DemoDining = {
  item: KAJEN,
  slug: "kajen",
  openDays: 60,
  tableLayout: "Dinner",
  copies: ["Lunch"],
  combinations: [
    { name: "Long table", tables: ["7", "8"], minCovers: 6, maxCovers: 8, onlineBookable: true },
    {
      name: "Window pair",
      tables: ["11", "12"],
      minCovers: 3,
      maxCovers: 4,
      onlineBookable: false,
    },
    {
      name: "Big group",
      tables: ["4", "5", "6"],
      minCovers: 9,
      maxCovers: 12,
      onlineBookable: false,
    },
  ],
  guests,
  needs,
  reservations: {
    lunchTimes: ["11:30", "12:30"],
    dinnerTimes: ["17:30", "18:30", "19:30"],
    lunchWeekdays: [0, 1, 2, 3, 4],
    dinnerWeekdays: [1, 2, 3, 4, 5],
    days: 7,
    outcomes: true,
    blockTables: ["11", "12"],
  },
  services: [
    {
      ...{ name: "Lunch", layout: "Lunch", weekdays: [0, 1, 2, 3, 4] },
      ...{ first: "11:30", last: "13:30", maxCoversPerSlot: 20 },
      turnTimes: [
        { upToParty: 4, minutes: 75 },
        { upToParty: 100, minutes: 90 },
      ],
      exceptions: [{ month: 12, day: 23, first: "12:00", last: "14:00", note: "Christmas lunch" }],
    },
    {
      ...{ name: "Dinner", layout: "Dinner", weekdays: [1, 2, 3, 4, 5] },
      ...{ first: "17:00", last: "21:00", maxCoversPerSlot: 24 },
      turnTimes: [
        { upToParty: 2, minutes: 90 },
        { upToParty: 4, minutes: 120 },
        { upToParty: 100, minutes: 150 },
      ],
      depositFromParty: 8,
      depositPerCoverMinor: 20_000,
      exceptions: [{ month: 12, day: 24, closed: true, note: "Christmas Eve" }],
    },
  ],
  page: {
    accentColor: "#0b5c7a",
    intro: {
      sv: "Boka bord i Kajen med utsikt över älven. Lunch vardagar och middag tisdag till lördag.",
      en: "Book a table in Kajen with a view of the river. Lunch on weekdays and dinner Tuesday to Saturday.",
    },
    policy: {
      sv: "Avboka kostnadsfritt senast tre timmar före. För sällskap från åtta personer tas en deposition på 200 kr per person.",
      en: "Cancel free of charge up to three hours before. Parties of eight or more pay a deposit of SEK 200 per person.",
    },
    contactPhone: "+46 31 555 01 00",
    contactEmail: "kajen@lindholmen-demo.bibi.test",
  },
};

const twoSeatT = ({ label, x, y }: PieceInput): DemoFloorPiece => ({
  ...{ kind: round, x, y, label, seats: 2, widthCm: 80, depthCm: 80 },
  ...{ minCovers: 1, maxCovers: 2 },
});

/** The summer terrace restaurant: a long narrow deck, 6 two-seaters on the rail, 4 four-seaters. */
export const terrassenRoom: DemoItem = {
  type: "Conference room",
  name: "Terrassen",
  fields: { Floor: 1, "Area m²": 156, Daylight: true, View: "River" },
  maxPeople: 30,
  priceKr: 800,
  priceUnit: "PER_HOUR",
};

export const terrassenFloorPlan: DemoFloorPlan = {
  item: "Terrassen",
  widthCm: 2400,
  depthCm: 650,
  fixed: [{ kind: "Door", x: 200, y: 650, emergencyExit: true }],
  layouts: [
    {
      name: "Terrace",
      useSeats: true,
      pieces: [
        ...[300, 650, 1000, 1350, 1700, 2050].map((x, i) =>
          twoSeatT({ label: String(i + 1), x, y: 150 }),
        ),
        ...[500, 1000, 1500, 2000].map((x, i) => fourSeat({ label: String(i + 7), x, y: 450 })),
      ],
    },
  ],
};

const terrassenDining: DemoDining = {
  item: "Terrassen",
  slug: "terrassen",
  openDays: 60,
  tableLayout: "Terrace",
  copies: [],
  combinations: [
    { name: "Long table", tables: ["8", "9"], minCovers: 5, maxCovers: 8, onlineBookable: true },
  ],
  guests: guests.slice(3),
  needs,
  reservations: {
    lunchTimes: ["12:00", "13:00"],
    dinnerTimes: ["17:30"],
    lunchWeekdays: [0, 1, 2, 3, 4, 5, 6],
    dinnerWeekdays: [3, 4, 5, 6],
    days: 3,
    outcomes: false,
  },
  services: [
    {
      ...{ name: "Terrace lunch", layout: "Terrace", weekdays: [0, 1, 2, 3, 4, 5, 6] },
      ...{ first: "11:30", last: "14:00", maxCoversPerSlot: 16 },
      turnTimes: [
        { upToParty: 4, minutes: 75 },
        { upToParty: 100, minutes: 90 },
      ],
    },
    {
      ...{ name: "Early dinner", layout: "Terrace", weekdays: [3, 4, 5, 6] },
      ...{ first: "17:00", last: "20:00", maxCoversPerSlot: 16 },
      turnTimes: [
        { upToParty: 4, minutes: 90 },
        { upToParty: 100, minutes: 120 },
      ],
    },
  ],
};

/** Both restaurant rooms (ADR 0119); the booking page is the organization's, set on Kajen. */
export const lindholmenDining: readonly DemoDining[] = [kajenDining, terrassenDining];
