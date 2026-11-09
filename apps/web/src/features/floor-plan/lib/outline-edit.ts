import { isSimpleOutline, outlineArea } from "@bibi/core/schemas";

export type Outline = [number, number][];

/** The schema's limits: a room is 1–200 m each way and has at most 64 corners. */
const MIN_CM = 100;
const MAX_CM = 20_000;
export const MAX_CORNERS = 64;

const clamp = ({ value }: { value: number }) => Math.max(0, Math.min(MAX_CM, Math.round(value)));

/** The room's size: the walls' far edges from the origin (at least a metre each way). */
export function outlineSize({ outline }: { outline: readonly (readonly [number, number])[] }) {
  return {
    widthCm: Math.max(MIN_CM, ...outline.map(([x]) => x)),
    depthCm: Math.max(MIN_CM, ...outline.map(([, y]) => y)),
  };
}

export function rectangle({ widthCm, depthCm }: { widthCm: number; depthCm: number }): Outline {
  return [
    [0, 0],
    [widthCm, 0],
    [widthCm, depthCm],
    [0, depthCm],
  ];
}

/** The outline with its points clockwise on screen, as stored. */
export function clockwise({ outline }: { outline: Outline }): Outline {
  return outlineArea({ outline }) < 0 ? [...outline].reverse() : outline;
}

export type MoveCornerInput = { outline: Outline; index: number; x: number; y: number };

/** One corner moved; null when the walls would cross. */
export function moveCorner({ outline, index, x, y }: MoveCornerInput): Outline | null {
  const next = outline.map((point, i): [number, number] =>
    i === index ? [clamp({ value: x }), clamp({ value: y })] : point,
  );
  return isSimpleOutline({ outline: next }) ? next : null;
}

export type InsertCornerInput = { outline: Outline; after: number; x: number; y: number };

/** A corner added on the wall that starts at `after`; null at the corner limit or if walls cross. */
export function insertCorner({ outline, after, x, y }: InsertCornerInput): Outline | null {
  if (outline.length >= MAX_CORNERS) return null;
  const point: [number, number] = [clamp({ value: x }), clamp({ value: y })];
  const next = [...outline.slice(0, after + 1), point, ...outline.slice(after + 1)];
  return isSimpleOutline({ outline: next }) ? next : null;
}

/** A corner deleted (its two walls become one); null for a triangle or if walls would cross. */
export function removeCorner({ outline, index }: { outline: Outline; index: number }) {
  if (outline.length <= 3) return null;
  const next = outline.filter((_, i) => i !== index);
  return isSimpleOutline({ outline: next }) ? next : null;
}

export type ScaleOutlineInput = { outline: Outline; widthCm: number; depthCm: number };

/** The same shape stretched to a new size. */
export function scaleOutline({ outline, widthCm, depthCm }: ScaleOutlineInput): Outline {
  const size = outlineSize({ outline });
  return outline.map(([x, y]) => [
    Math.round((x * widthCm) / size.widthCm),
    Math.round((y * depthCm) / size.depthCm),
  ]);
}

/** A wall's length in centimetres. */
export function wallLength({ outline, index }: { outline: Outline; index: number }) {
  const [x1, y1] = outline[index] ?? [0, 0];
  const [x2, y2] = outline[(index + 1) % outline.length] ?? [0, 0];
  return Math.hypot(x2 - x1, y2 - y1);
}
