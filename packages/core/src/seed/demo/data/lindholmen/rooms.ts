import type { DemoItem } from "../../config-types";

type RoomInput = {
  name: string;
  floor: number;
  area: number;
  daylight: boolean;
  view: string;
  setups: Record<string, number>;
  kr: number;
};

const room = ({ name, floor, area, daylight, view, setups, kr }: RoomInput): DemoItem => ({
  type: "Konferensrum",
  name,
  fields: { Våning: floor, "Yta m²": area, Dagsljus: daylight, Utsikt: view },
  priceKr: kr,
  priceUnit: "PER_HOUR",
  setups,
});

/** Lindholmen's 10 conference rooms (`docs/demo-seed.md`, Katalog). Price per hour excl. VAT. */
export const lindholmenRooms: readonly DemoItem[] = [
  room({
    ...{ name: "Vinga (aula)", floor: 1, area: 260, daylight: true, view: "Älven", kr: 4500 },
    setups: { Bio: 220, Klassrum: 120, Bankett: 160, Mingel: 250 },
  }),
  room({
    ...{ name: "Hönö", floor: 2, area: 90, daylight: true, view: "Älven", kr: 1900 },
    setups: { Bio: 70, Klassrum: 40, "U-bord": 28, "Ö-sittning": 48, Bankett: 56 },
  }),
  room({
    ...{ name: "Öckerö", floor: 2, area: 70, daylight: true, view: "Innergården", kr: 1500 },
    setups: { Bio: 50, Klassrum: 30, "U-bord": 22, "Ö-sittning": 36 },
  }),
  room({
    ...{ name: "Styrsö", floor: 3, area: 45, daylight: true, view: "Älven", kr: 950 },
    setups: { Styrelse: 16, "U-bord": 14 },
  }),
  room({
    ...{ name: "Vrångö", floor: 3, area: 45, daylight: true, view: "Innergården", kr: 900 },
    setups: { Styrelse: 14, "U-bord": 12 },
  }),
  room({
    ...{ name: "Donsö", floor: 3, area: 32, daylight: true, view: "Älven", kr: 700 },
    setups: { Styrelse: 10 },
  }),
  room({
    ...{ name: "Brännö", floor: 3, area: 32, daylight: true, view: "Innergården", kr: 650 },
    setups: { Styrelse: 10 },
  }),
  room({
    ...{ name: "Asperö", floor: 3, area: 20, daylight: false, view: "Ingen", kr: 450 },
    setups: { Styrelse: 6 },
  }),
  room({
    ...{ name: "Knippla (verkstad)", floor: 1, area: 120, daylight: true, view: "Innergården" },
    ...{ kr: 2200, setups: { Klassrum: 50, "Ö-sittning": 60, Mingel: 100 } },
  }),
  room({
    ...{ name: "Utsikten (takterrass)", floor: 5, area: 150, daylight: true, view: "Älven" },
    ...{ kr: 3800, setups: { Bankett: 90, Mingel: 150 } },
  }),
];
