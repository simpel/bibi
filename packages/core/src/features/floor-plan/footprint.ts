import { CHAIR_DEPTH_CM, type EffectiveElement } from "./seats";

/** A point in centimetres. */
export type FloorPoint = readonly [number, number];

/** An element placed in a drawing: its centre, rotation and effective size and seats. */
export type PlacedElement = EffectiveElement & {
  id: string;
  xCm: number;
  yCm: number;
  rotationDeg: number;
};

export type ToWorldInput = { element: PlacedElement; x: number; y: number };

/** A point in the element's own frame moved to the drawing's frame. */
export function toWorld({ element, x, y }: ToWorldInput): FloorPoint {
  const radians = (element.rotationDeg * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  return [element.xCm + x * cos - y * sin, element.yCm + x * sin + y * cos];
}

const box = ({ left, top, right, bottom }: Record<"left" | "top" | "right" | "bottom", number>) =>
  [
    [-left, -top],
    [right, -top],
    [right, bottom],
    [-left, bottom],
  ] as const;

/** The floor the element takes, chairs included, as a convex polygon in the drawing's frame. */
export function footprint({ element }: { element: PlacedElement }): FloorPoint[] {
  const { shape, widthCm: w, depthCm: d, around, sides } = element;
  const place = ({ point: [x, y] }: { point: readonly [number, number] }) =>
    toWorld({ element, x, y });
  if (shape === "ROUND") {
    const radius = w / 2 + (around > 0 ? CHAIR_DEPTH_CM : 0);
    return Array.from({ length: 16 }, (_, index) => {
      const angle = (2 * Math.PI * index) / 16;
      return place({ point: [radius * Math.cos(angle), radius * Math.sin(angle)] });
    });
  }
  if (shape === "SEAT_ROW") {
    const half = CHAIR_DEPTH_CM / 2;
    return box({ left: w / 2, top: half, right: w / 2, bottom: half }).map((point) =>
      place({ point }),
    );
  }
  const extra = ({ count }: { count: number }) => (count > 0 ? CHAIR_DEPTH_CM : 0);
  return box({
    left: w / 2 + extra({ count: sides.left }),
    top: d / 2 + extra({ count: sides.top }),
    right: w / 2 + extra({ count: sides.right }),
    bottom: d / 2 + extra({ count: sides.bottom }),
  }).map((point) => place({ point }));
}

/** The area in front of the element (its local bottom side) that must stay clear, if any. */
export function keepClearZone({ element }: { element: PlacedElement }): FloorPoint[] | null {
  if (!element.keepClearCm) return null;
  const { widthCm: w, depthCm: d, keepClearCm } = element;
  const half = w / 2 + 20;
  return [
    [-half, d / 2],
    [half, d / 2],
    [half, d / 2 + keepClearCm],
    [-half, d / 2 + keepClearCm],
  ].map(([x, y]) => toWorld({ element, x: x ?? 0, y: y ?? 0 }));
}

const project = ({ points, nx, ny }: { points: readonly FloorPoint[]; nx: number; ny: number }) =>
  points.map(([x, y]) => x * nx + y * ny);

/** Two convex polygons overlap by more than a centimetre (separating axis test). */
export function polygonsOverlap({ a, b }: { a: readonly FloorPoint[]; b: readonly FloorPoint[] }) {
  for (const polygon of [a, b]) {
    for (let index = 0; index < polygon.length; index += 1) {
      const [x1, y1] = polygon[index] ?? [0, 0];
      const [x2, y2] = polygon[(index + 1) % polygon.length] ?? [0, 0];
      const length = Math.hypot(y1 - y2, x2 - x1) || 1;
      const [nx, ny] = [(y1 - y2) / length, (x2 - x1) / length];
      const pa = project({ points: a, nx, ny });
      const pb = project({ points: b, nx, ny });
      if (Math.min(...pa) >= Math.max(...pb) - 1 || Math.min(...pb) >= Math.max(...pa) - 1) {
        return false;
      }
    }
  }
  return true;
}

/** The point is inside the outline, or on one of its corners. */
export function insideOutline({
  point,
  outline,
}: {
  point: FloorPoint;
  outline: readonly FloorPoint[];
}) {
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = outline.length - 1; i < outline.length; j = i, i += 1) {
    const [xi, yi] = outline[i] ?? [0, 0];
    const [xj, yj] = outline[j] ?? [0, 0];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside || outline.some(([ox, oy]) => Math.hypot(ox - x, oy - y) < 2);
}
