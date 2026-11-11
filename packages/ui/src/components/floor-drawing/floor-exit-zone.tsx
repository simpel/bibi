import { useId } from "react";

/** How deep an emergency exit's no-block zone reaches into the room at least (as in core). */
const MIN_DEPTH_CM = 150;

export type FloorExitZoneProps = {
  widthCm: number;
  /** The opening's own depth: the zone starts at its room side. */
  depthCm: number;
  swingDeg: number;
};

/**
 * The area in front of an emergency exit that furniture may not block, in the opening's own frame
 * (room on local +y): the opening plus 20 cm on each side, at least 150 cm deep and never
 * shallower than the door's swing. The same rule as core's `exitZone`.
 */
export function FloorExitZone({ widthCm: w, depthCm: d, swingDeg }: FloorExitZoneProps) {
  const hatch = useId();
  const depth = Math.max(MIN_DEPTH_CM, swingDeg > 0 ? w : 0);
  return (
    <g data-slot="floor-exit-zone" pointerEvents="none">
      <defs>
        <pattern id={hatch} width={24} height={24} patternUnits="userSpaceOnUse">
          <path className="stroke-success" d="M-6 6L6 -6M0 24L24 0M18 30L30 18" strokeWidth={3} />
        </pattern>
      </defs>
      <rect
        className="fill-success/10 stroke-success stroke-2 [stroke-dasharray:10_8]"
        x={-w / 2 - 20}
        y={d / 2}
        width={w + 40}
        height={depth}
      />
      <rect
        fill={`url(#${hatch})`}
        opacity={0.35}
        x={-w / 2 - 20}
        y={d / 2}
        width={w + 40}
        height={depth}
      />
    </g>
  );
}
