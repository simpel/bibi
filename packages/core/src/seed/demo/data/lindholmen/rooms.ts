import type { DemoItem } from "../../config-types";

type RoomInput = {
  name: string;
  floor: number;
  area: number;
  daylight: boolean;
  view: string;
  /** Layout name → typed capacity (ADR 0103). */
  layouts: Record<string, number>;
  kr: number;
  /** ADR 0059: overrides the room type's teardown minutes. */
  teardownMinutes?: number;
};

const room = ({
  name,
  floor,
  area,
  daylight,
  view,
  layouts,
  kr,
  ...buffers
}: RoomInput): DemoItem => ({
  ...buffers,
  type: "Conference room",
  name,
  fields: { Floor: floor, "Area m²": area, Daylight: daylight, View: view },
  // ADR 0103: the legal people limit, one person per square metre.
  maxPeople: area,
  priceKr: kr,
  priceUnit: "PER_HOUR",
  layouts,
});

/** Lindholmen's 10 conference rooms (`docs/demo-seed.md`, Catalog). Price per hour excl. VAT. */
export const lindholmenRooms: readonly DemoItem[] = [
  room({
    ...{ name: "Vinga (auditorium)", floor: 1, area: 260, daylight: true, view: "River", kr: 4500 },
    teardownMinutes: 30,
    layouts: { Theatre: 220, Classroom: 120, Banquet: 160, Reception: 250 },
  }),
  room({
    ...{ name: "Hönö", floor: 2, area: 90, daylight: true, view: "River", kr: 1900 },
    layouts: { Theatre: 70, Classroom: 40, "U-shape": 28, Cabaret: 48, Banquet: 56 },
  }),
  room({
    ...{ name: "Öckerö", floor: 2, area: 70, daylight: true, view: "Courtyard", kr: 1500 },
    layouts: { Theatre: 50, Classroom: 30, "U-shape": 22, Cabaret: 36 },
  }),
  room({
    ...{ name: "Styrsö", floor: 3, area: 45, daylight: true, view: "River", kr: 950 },
    layouts: { Boardroom: 16, "U-shape": 14 },
  }),
  room({
    ...{ name: "Vrångö", floor: 3, area: 45, daylight: true, view: "Courtyard", kr: 900 },
    layouts: { Boardroom: 14, "U-shape": 12 },
  }),
  room({
    ...{ name: "Donsö", floor: 3, area: 32, daylight: true, view: "River", kr: 700 },
    layouts: { Boardroom: 10 },
  }),
  room({
    ...{ name: "Brännö", floor: 3, area: 32, daylight: true, view: "Courtyard", kr: 650 },
    layouts: { Boardroom: 10 },
  }),
  room({
    ...{ name: "Asperö", floor: 3, area: 20, daylight: false, view: "None", kr: 450 },
    layouts: { Boardroom: 6 },
  }),
  room({
    ...{ name: "Knippla (workshop)", floor: 1, area: 120, daylight: true, view: "Courtyard" },
    ...{ kr: 2200, layouts: { Classroom: 50, Cabaret: 60, Reception: 100 } },
  }),
  room({
    ...{ name: "The View (roof terrace)", floor: 5, area: 150, daylight: true, view: "River" },
    ...{ kr: 3800, layouts: { Banquet: 90, Reception: 150 } },
  }),
];
