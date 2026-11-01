export type StatLinePathInput = {
  values: readonly number[];
  width: number;
  height: number;
  /** Vertical room kept free above and below the line. */
  padY: number;
};

export type StatLinePoint = { x: number; y: number };

export type StatLinePath = { points: StatLinePoint[]; line: string; area: string };

function round({ value }: { value: number }) {
  return Number(value.toFixed(2));
}

/** Points scaled to the series' min and max; a flat series sits in the middle. */
export function statLinePoints({ values, width, height, padY }: StatLinePathInput) {
  const min = Math.min(...values);
  const range = Math.max(...values) - min;
  const step = values.length > 1 ? width / (values.length - 1) : 0;
  return values.map((value, index) => ({
    x: round({ value: index * step }),
    y: round({
      value:
        range === 0 ? height / 2 : height - padY - ((value - min) / range) * (height - 2 * padY),
    }),
  }));
}

/** A smooth curve through the points: horizontal control points, so it never overshoots. */
function curve({ points }: { points: StatLinePoint[] }) {
  const [first] = points;
  if (!first) return "";
  let path = `M${first.x} ${first.y}`;
  for (let index = 1; index < points.length; index += 1) {
    const prev = points[index - 1] as StatLinePoint;
    const next = points[index] as StatLinePoint;
    const mid = round({ value: (prev.x + next.x) / 2 });
    path += ` C${mid} ${prev.y} ${mid} ${next.y} ${next.x} ${next.y}`;
  }
  return path;
}

/** SVG path strings for the line and for the area under it down to the bottom edge. */
export function statLinePath({ values, width, height, padY }: StatLinePathInput): StatLinePath {
  const points = statLinePoints({ values, width, height, padY });
  const first = points[0];
  const last = points[points.length - 1];
  if (!first || !last) return { points, line: "", area: "" };
  const line = curve({ points });
  return { points, line, area: `${line} L${last.x} ${height} L${first.x} ${height} Z` };
}
