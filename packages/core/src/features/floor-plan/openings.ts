import type { FloorPoint } from "./footprint";
import { insideOutline } from "./footprint";

/** Where an opening sits: its centre on a wall and its rotation along it (ADR 0102). */
export type WallPlacement = { xCm: number; yCm: number; rotationDeg: number };

export type SnapToWallInput = {
  outline: readonly FloorPoint[];
  xCm: number;
  yCm: number;
  /** The opening's width; it is kept within the wall it lands on where the wall is long enough. */
  widthCm: number;
};

type Candidate = WallPlacement & { distance: number };

/** The nearest point of one wall, turned so the piece's local bottom faces into the room. */
function onWall({
  a,
  b,
  input,
}: {
  a: FloorPoint;
  b: FloorPoint;
  input: SnapToWallInput;
}): Candidate | null {
  const [dx, dy] = [b[0] - a[0], b[1] - a[1]];
  const length = Math.hypot(dx, dy);
  if (length < 1) return null;
  const along = ((input.xCm - a[0]) * dx + (input.yCm - a[1]) * dy) / length;
  const half = Math.min(input.widthCm / 2, length / 2);
  const t = Math.min(Math.max(along, half), length - half) / length;
  const [x, y] = [a[0] + dx * t, a[1] + dy * t];
  const degrees = (Math.atan2(dy, dx) * 180) / Math.PI;
  // Local +y after rotating by `degrees` is (-sin, cos); flip when that points out of the room.
  const radians = (degrees * Math.PI) / 180;
  const probe: FloorPoint = [x - Math.sin(radians) * 5, y + Math.cos(radians) * 5];
  const inward = insideOutline({ point: probe, outline: input.outline });
  const rotationDeg = (((Math.round(degrees) + (inward ? 0 : 180)) % 360) + 360) % 360;
  const distance = Math.hypot(x - input.xCm, y - input.yCm);
  return { xCm: Math.round(x), yCm: Math.round(y), rotationDeg, distance };
}

/** A door or window moved onto the nearest wall of the outline, along it and facing in. */
export function snapToWall({ outline, xCm, yCm, widthCm }: SnapToWallInput): WallPlacement {
  const input = { outline, xCm, yCm, widthCm };
  let best: Candidate | null = null;
  for (let index = 0; index < outline.length; index += 1) {
    const a = outline[index];
    const b = outline[(index + 1) % outline.length];
    if (!a || !b) continue;
    const candidate = onWall({ a, b, input });
    if (candidate && (!best || candidate.distance < best.distance)) best = candidate;
  }
  if (!best) return { xCm, yCm, rotationDeg: 0 };
  const { distance: _distance, ...placement } = best;
  return placement;
}
