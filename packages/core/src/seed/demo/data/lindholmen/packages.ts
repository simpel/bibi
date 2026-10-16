import type { DemoChoiceGroup, DemoItem, DemoPart } from "../../config-types";

const hour = 60;

type PackageInput = Pick<DemoItem, "name" | "choices"> & { kr: number; parts: DemoPart[] };

const pkg = ({ name, kr, parts, choices }: PackageInput): DemoItem => ({
  type: "Package",
  name,
  ...{ priceKr: kr, priceUnit: "PER_PERSON", parts },
  ...(choices ? { choices } : {}),
});

type RoomChoiceInput = { rooms: readonly string[]; offsetMinutes: number; hours: number };

const roomChoice = ({ rooms, offsetMinutes, hours }: RoomChoiceInput): DemoChoiceGroup => ({
  name: "Room",
  options: rooms.map((name) => ({ name, offsetMinutes, durationMinutes: hours * hour })),
});

const meetingRooms = ["Hönö", "Öckerö", "Styrsö", "Vrångö"];

/** Lindholmen's 4 catalog packages (`docs/demo-seed.md`, Packages). Offsets from the start. */
export const lindholmenPackages: readonly DemoItem[] = [
  pkg({
    ...{ name: "Half-day conference", kr: 545 },
    choices: [roomChoice({ rooms: meetingRooms, offsetMinutes: 0, hours: 4 })],
    parts: [
      { name: "Morning break", offsetMinutes: 90 },
      { name: "Conference lunch", offsetMinutes: 210 },
    ],
  }),
  pkg({
    ...{ name: "Full-day conference", kr: 795 },
    choices: [roomChoice({ rooms: meetingRooms, offsetMinutes: 0, hours: 8 })],
    parts: [
      { name: "Morning break", offsetMinutes: 90 },
      { name: "Conference lunch", offsetMinutes: 210 },
      { name: "Afternoon break", offsetMinutes: 360 },
    ],
  }),
  pkg({
    ...{ name: "Day + evening", kr: 1016 },
    choices: [roomChoice({ rooms: ["Hönö", "Öckerö"], offsetMinutes: 15, hours: 7 })],
    parts: [
      { name: "Sparkling welcome drink", offsetMinutes: 0 },
      { name: "Morning break", offsetMinutes: 90 },
      { name: "Conference lunch", offsetMinutes: 180 },
      { name: "Evening tour", offsetMinutes: 480 },
      { name: "Reception buffet", offsetMinutes: 570 },
    ],
  }),
  pkg({
    ...{ name: "Evening event", kr: 1290 },
    parts: [
      { name: "Evening tour", offsetMinutes: 0 },
      { name: "Sparkling welcome drink", offsetMinutes: 90 },
      { name: "The View (roof terrace)", offsetMinutes: 90, durationMinutes: 5 * hour },
      { name: "Three-course dinner", offsetMinutes: 120 },
      { name: "Wine package (2 glasses)", offsetMinutes: 120 },
    ],
  }),
];

/** Nordkust Logistik's own package (`item.saveAsPackage`), seeded with the customer. */
export const nordkustPackage: DemoItem = pkg({
  ...{ name: "Nordkust management team", kr: 595 },
  parts: [
    { name: "Styrsö", offsetMinutes: 0, durationMinutes: 4 * hour },
    { name: "Morning break", offsetMinutes: 30 },
    { name: "Conference lunch", offsetMinutes: 180 },
  ],
});
