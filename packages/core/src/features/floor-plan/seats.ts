/**
 * Client-safe floor geometry (ADR 0099): effective size and seats of a floor element, and where
 * its chairs stand. Pure functions in centimetres and degrees; the editor, the read operations and
 * the renderer all use these, so a drawing and its seat count never disagree.
 */

export const FLOOR_SHAPES = ["RECT", "ROUND", "SEAT_ROW", "ZONE", "DOOR", "WINDOW"] as const;
export type FloorShape = (typeof FLOOR_SHAPES)[number];

/** Depth a chair takes beside a table, and its distance from the table edge to its centre. */
export const CHAIR_DEPTH_CM = 50;
export const CHAIR_OFFSET_CM = 28;
/** Width one chair takes in a row of chairs. */
export const SEAT_PITCH_CM = 50;

export type SeatSides = { top: number; right: number; bottom: number; left: number };

export type SeatCounts = {
  seats: number;
  seatsTop: number;
  seatsRight: number;
  seatsBottom: number;
  seatsLeft: number;
};

export type FloorKindLike = SeatCounts & {
  shape: FloorShape;
  widthCm: number;
  depthCm: number;
  fixed: boolean;
  keepClearCm: number | null;
  /** DOOR, WINDOW: how far it opens in degrees; null = it does not open (ADR 0102). */
  swingDeg: number | null;
};

/** The element's owned overrides; null = the kind's. */
export type FloorOverrides = {
  widthCm: number | null;
  depthCm: number | null;
  seats: number | null;
  seatsTop: number | null;
  seatsRight: number | null;
  seatsBottom: number | null;
  seatsLeft: number | null;
  /** DOOR, WINDOW: own opening angle. Optional so pieces saved before ADR 0102 read as inherit. */
  swingDeg?: number | null;
};

export type EffectiveElement = {
  shape: FloorShape;
  widthCm: number;
  depthCm: number;
  /** ROUND: chairs around the body. SEAT_ROW: chairs along the row. Others: 0. */
  around: number;
  /** RECT: chairs per side in the element's own frame. Others: all 0. */
  sides: SeatSides;
  seatCount: number;
  fixed: boolean;
  keepClearCm: number | null;
  /** DOOR, WINDOW: opening angle after inheritance; 0 = does not open. Others: 0. */
  swingDeg: number;
};

/** A door or a window: an opening in a wall, fixed and without chairs (ADR 0102). */
export const isOpening = ({ shape }: { shape: FloorShape }) =>
  shape === "DOOR" || shape === "WINDOW";

const NO_SIDES: SeatSides = { top: 0, right: 0, bottom: 0, left: 0 };

export type EffectiveElementInput = { element: FloorOverrides; kind: FloorKindLike };

/** Size and seats after inheritance; only the counts the shape uses are kept. */
export function effectiveElement({ element, kind }: EffectiveElementInput): EffectiveElement {
  const widthCm = element.widthCm ?? kind.widthCm;
  const depthCm = kind.shape === "ROUND" ? widthCm : (element.depthCm ?? kind.depthCm);
  const usesAround = kind.shape === "ROUND" || kind.shape === "SEAT_ROW";
  const around = usesAround ? (element.seats ?? kind.seats) : 0;
  const sides =
    kind.shape === "RECT"
      ? {
          top: element.seatsTop ?? kind.seatsTop,
          right: element.seatsRight ?? kind.seatsRight,
          bottom: element.seatsBottom ?? kind.seatsBottom,
          left: element.seatsLeft ?? kind.seatsLeft,
        }
      : NO_SIDES;
  const seatCount = around + sides.top + sides.right + sides.bottom + sides.left;
  const { shape } = kind;
  if (isOpening({ shape })) {
    const swingDeg = element.swingDeg ?? kind.swingDeg ?? 0;
    // A door's swing is the floor that must stay clear; a window never blocks the floor.
    const keepClearCm = shape === "DOOR" && swingDeg > 0 ? widthCm : null;
    const sizes = { widthCm, depthCm, around: 0, sides: NO_SIDES, seatCount: 0 };
    return { shape, ...sizes, fixed: true, keepClearCm, swingDeg };
  }
  const { fixed, keepClearCm } = kind;
  return { shape, widthCm, depthCm, around, sides, seatCount, fixed, keepClearCm, swingDeg: 0 };
}

/** One chair: its centre and the direction it faces, in the element's own frame. */
export type SeatPosition = { x: number; y: number; rotationDeg: number };

const spread = ({ count, length }: { count: number; length: number }) =>
  Array.from({ length: count }, (_, index) => -length / 2 + (length * (index + 0.5)) / count);

/** Where the element's chairs stand; each faces the body (a row of chairs faces local up). */
export function seatPositions({ element }: { element: EffectiveElement }): SeatPosition[] {
  const { shape, widthCm: w, depthCm: d, around, sides } = element;
  if (shape === "ROUND") {
    const radius = w / 2 + CHAIR_OFFSET_CM;
    return Array.from({ length: around }, (_, index) => {
      const angle = (2 * Math.PI * index) / around - Math.PI / 2;
      const rotationDeg = (angle * 180) / Math.PI - 90;
      return { x: radius * Math.cos(angle), y: radius * Math.sin(angle), rotationDeg };
    });
  }
  if (shape === "SEAT_ROW") {
    return spread({ count: around, length: w }).map((x) => ({ x, y: 0, rotationDeg: 0 }));
  }
  const edgeY = d / 2 + CHAIR_OFFSET_CM;
  const edgeX = w / 2 + CHAIR_OFFSET_CM;
  return [
    ...spread({ count: sides.top, length: w }).map((x) => ({ x, y: -edgeY, rotationDeg: 180 })),
    ...spread({ count: sides.bottom, length: w }).map((x) => ({ x, y: edgeY, rotationDeg: 0 })),
    ...spread({ count: sides.left, length: d }).map((y) => ({ x: -edgeX, y, rotationDeg: 90 })),
    ...spread({ count: sides.right, length: d }).map((y) => ({ x: edgeX, y, rotationDeg: -90 })),
  ];
}
