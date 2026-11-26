import type { FloorDrawingElement, FloorDrawingSeat } from "@bibi/ui";

/** How a table reads on the evening's floor: booked, held back for walk-ins, or free. */
export type TableState = "booked" | "held" | "free";

type TableSpec = {
  label: string;
  shape: "ROUND" | "RECT";
  x: number;
  y: number;
  w: number;
  d: number;
  seats: number;
  state: TableState;
};

export const ROOM = { widthCm: 1120, depthCm: 760 } as const;

export const ROOM_OUTLINE = [
  [0, 0],
  [ROOM.widthCm, 0],
  [ROOM.widthCm, ROOM.depthCm],
  [0, ROOM.depthCm],
] as const;

/** Mock dining room "Kajen": 12 tables, 7 + 8 pushed together as one combination. */
const TABLES: readonly TableSpec[] = [
  { label: "1", shape: "ROUND", x: 180, y: 170, w: 110, d: 110, seats: 4, state: "booked" },
  { label: "2", shape: "ROUND", x: 430, y: 170, w: 110, d: 110, seats: 4, state: "free" },
  { label: "3", shape: "ROUND", x: 680, y: 170, w: 110, d: 110, seats: 4, state: "booked" },
  { label: "4", shape: "RECT", x: 940, y: 170, w: 160, d: 80, seats: 4, state: "booked" },
  { label: "7", shape: "RECT", x: 300, y: 450, w: 160, d: 80, seats: 4, state: "booked" },
  { label: "8", shape: "RECT", x: 460, y: 450, w: 160, d: 80, seats: 4, state: "booked" },
  { label: "5", shape: "ROUND", x: 760, y: 450, w: 110, d: 110, seats: 6, state: "free" },
  { label: "6", shape: "ROUND", x: 990, y: 450, w: 110, d: 110, seats: 6, state: "booked" },
  { label: "9", shape: "RECT", x: 200, y: 650, w: 80, d: 80, seats: 2, state: "free" },
  { label: "10", shape: "RECT", x: 420, y: 650, w: 80, d: 80, seats: 2, state: "booked" },
  { label: "11", shape: "RECT", x: 640, y: 650, w: 80, d: 80, seats: 2, state: "held" },
  { label: "12", shape: "RECT", x: 860, y: 650, w: 80, d: 80, seats: 2, state: "held" },
];

const GAP = 30;
const TONE = { booked: "selected", held: "warning", free: "muted" } as const;

function roundSeats({ diameter, count }: { diameter: number; count: number }) {
  const radius = diameter / 2 + GAP;
  return Array.from({ length: count }, (_, index): FloorDrawingSeat => {
    const angle = (360 / count) * index - 90;
    const rad = (angle * Math.PI) / 180;
    return {
      x: Math.round(radius * Math.cos(rad)),
      y: Math.round(radius * Math.sin(rad)),
      rotationDeg: angle - 90,
    };
  });
}

function rectSeats({ w, d, count }: { w: number; d: number; count: number }) {
  if (count === 2) {
    return [
      { x: -w / 2 - GAP, y: 0, rotationDeg: 90 },
      { x: w / 2 + GAP, y: 0, rotationDeg: -90 },
    ];
  }
  const perSide = count / 2;
  return Array.from(
    { length: perSide },
    (_, index) => -w / 2 + (w * (index + 0.5)) / perSide,
  ).flatMap((x): FloorDrawingSeat[] => [
    { x, y: -d / 2 - GAP, rotationDeg: 180 },
    { x, y: d / 2 + GAP, rotationDeg: 0 },
  ]);
}

/** The mock tables as `FloorDrawing` pieces; `name` gives each its (hidden) accessible name. */
export function floorTables({ name }: { name: (label: string) => string }): FloorDrawingElement[] {
  return TABLES.map((table) => ({
    id: `table-${table.label}`,
    shape: table.shape,
    xCm: table.x,
    yCm: table.y,
    rotationDeg: 0,
    widthCm: table.w,
    depthCm: table.d,
    seats:
      table.shape === "ROUND"
        ? roundSeats({ diameter: table.w, count: table.seats })
        : rectSeats({ w: table.w, d: table.d, count: table.seats }),
    label: table.label,
    fixed: false,
    keepClearCm: null,
    name: name(table.label),
    tone: TONE[table.state],
  }));
}
