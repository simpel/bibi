import { cn } from "../../lib/cn";

/** Thickness of the wall line an opening breaks (the walls are drawn 6 wide). */
const GAP = 14;

export type FloorOpeningProps = {
  kind: "DOOR" | "WINDOW";
  widthCm: number;
  /** How far it opens in degrees; 0 = a sliding door or a fixed pane. */
  swingDeg: number;
  selected: boolean;
};

/** The leaf's free end after opening `swingDeg` from the wall, hinged at the left end. */
function leafEnd({ widthCm, swingDeg }: { widthCm: number; swingDeg: number }) {
  const radians = (swingDeg * Math.PI) / 180;
  return { x: -widthCm / 2 + widthCm * Math.cos(radians), y: widthCm * Math.sin(radians) };
}

/**
 * A door or window in its own frame (ADR 0102): centred on the wall line, the room on local +y.
 * A door breaks the wall and shows its leaf and swing; a window shows a pane in the wall and, if
 * it opens, its swing dashed.
 */
export function FloorOpening({ kind, widthCm: w, swingDeg, selected }: FloorOpeningProps) {
  const stroke = selected ? "stroke-primary" : "stroke-foreground";
  const end = leafEnd({ widthCm: w, swingDeg });
  const arc =
    swingDeg > 0 ? `M ${w / 2} 0 A ${w} ${w} 0 0 1 ${end.x.toFixed(1)} ${end.y.toFixed(1)}` : null;
  if (kind === "WINDOW") {
    return (
      <g>
        <rect
          className={cn("fill-card stroke-2", stroke)}
          x={-w / 2}
          y={-GAP / 2}
          width={w}
          height={GAP}
        />
        <line className={cn("stroke-2", stroke)} x1={-w / 2} y1={0} x2={w / 2} y2={0} />
        {arc ? (
          <path className={cn("fill-none stroke-2 [stroke-dasharray:6_6]", stroke)} d={arc} />
        ) : null}
      </g>
    );
  }
  return (
    <g>
      <rect className="fill-card" x={-w / 2} y={-GAP / 2} width={w} height={GAP} />
      {arc ? (
        <>
          <path className={cn("fill-warning/10 stroke-none")} d={`${arc} L ${-w / 2} 0 Z`} />
          <path className={cn("fill-none stroke-2 [stroke-dasharray:8_6]", stroke)} d={arc} />
          <line
            className={cn("stroke-[5] [stroke-linecap:round]", stroke)}
            x1={-w / 2}
            y1={0}
            x2={end.x}
            y2={end.y}
          />
        </>
      ) : (
        <line
          className={cn("stroke-[5]", stroke)}
          x1={-w / 2}
          y1={GAP / 2}
          x2={w / 2}
          y2={GAP / 2}
        />
      )}
    </g>
  );
}
