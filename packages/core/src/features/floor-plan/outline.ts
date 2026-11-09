import type { FloorPoint } from "./footprint";

const cross = ({ o, a, b }: { o: FloorPoint; a: FloorPoint; b: FloorPoint }) =>
  (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);

type Segment = readonly [FloorPoint, FloorPoint];

/** The two walls cross or touch (shared corners of neighbours are not passed in). */
function segmentsMeet({ s, t }: { s: Segment; t: Segment }) {
  const [p1, p2] = s;
  const [q1, q2] = t;
  const d1 = cross({ o: q1, a: q2, b: p1 });
  const d2 = cross({ o: q1, a: q2, b: p2 });
  const d3 = cross({ o: p1, a: p2, b: q1 });
  const d4 = cross({ o: p1, a: p2, b: q2 });
  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
    return true;
  }
  const on = ({ a, b, p }: { a: FloorPoint; b: FloorPoint; p: FloorPoint }) =>
    cross({ o: a, a: b, b: p }) === 0 &&
    Math.min(a[0], b[0]) <= p[0] &&
    p[0] <= Math.max(a[0], b[0]) &&
    Math.min(a[1], b[1]) <= p[1] &&
    p[1] <= Math.max(a[1], b[1]);
  return (
    on({ a: q1, b: q2, p: p1 }) ||
    on({ a: q1, b: q2, p: p2 }) ||
    on({ a: p1, b: p2, p: q1 }) ||
    on({ a: p1, b: p2, p: q2 })
  );
}

/** Twice the signed area: positive when the points run clockwise on screen (y grows down). */
export function outlineArea({ outline }: { outline: readonly FloorPoint[] }) {
  let sum = 0;
  outline.forEach(([x1, y1], index) => {
    const [x2, y2] = outline[(index + 1) % outline.length] ?? [0, 0];
    sum += x1 * y2 - x2 * y1;
  });
  return sum;
}

/**
 * The walls form one simple room: no wall crosses or touches another except its neighbours at
 * their shared corner, no two corners coincide, and the room has an area.
 */
export function isSimpleOutline({ outline }: { outline: readonly FloorPoint[] }) {
  const n = outline.length;
  if (n < 3 || outlineArea({ outline }) === 0) return false;
  const keys = new Set(outline.map(([x, y]) => `${x},${y}`));
  if (keys.size !== n) return false;
  const wall = ({ index }: { index: number }): Segment => [
    outline[index] ?? [0, 0],
    outline[(index + 1) % n] ?? [0, 0],
  ];
  for (let i = 0; i < n; i += 1) {
    for (let j = i + 2; j < n; j += 1) {
      if (i === 0 && j === n - 1) continue;
      if (segmentsMeet({ s: wall({ index: i }), t: wall({ index: j }) })) return false;
    }
  }
  return true;
}
