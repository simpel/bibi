import { cva } from "class-variance-authority";
import { type ComponentProps, type ReactNode, useId } from "react";
import { cn } from "../../lib/cn";
import { FloorExitZone } from "./floor-exit-zone";
import { FloorOpening } from "./floor-opening";

/** One chair: its centre and facing, in the element's own frame (centimetres, degrees). */
export type FloorDrawingSeat = { x: number; y: number; rotationDeg: number };

export type FloorDrawingShape = "RECT" | "ROUND" | "SEAT_ROW" | "ZONE" | "DOOR" | "WINDOW";

export type FloorDrawingTone = "default" | "selected" | "warning" | "muted" | "ghost";

/** A piece as drawn: geometry is computed by the caller (core's floor geometry). */
export type FloorDrawingElement = {
  id: string;
  shape: FloorDrawingShape;
  xCm: number;
  yCm: number;
  rotationDeg: number;
  widthCm: number;
  depthCm: number;
  seats: readonly FloorDrawingSeat[];
  label: string | null;
  fixed: boolean;
  keepClearCm: number | null;
  /** DOOR, WINDOW: how far it opens in degrees (0 or left out = it does not). */
  swingDeg?: number;
  /** DOOR, WINDOW: an emergency exit, drawn green with its no-block zone in front of it. */
  emergencyExit?: boolean;
  /** Accessible name of the piece, e.g. "Round table 3, 10 seats". */
  name: string;
  tone?: FloorDrawingTone;
};

const CHAIR = 44;
const ROW_DEPTH = 50;

export const floorBodyVariants = cva("stroke-[2.5]", {
  variants: {
    kind: {
      piece: "fill-card stroke-foreground",
      fixed: "fill-muted stroke-muted-foreground",
      zone: "fill-accent stroke-primary [stroke-dasharray:10_8]",
      row: "fill-transparent stroke-transparent",
    },
    tone: {
      default: "",
      selected: "stroke-primary stroke-[6]",
      warning: "stroke-warning stroke-[5]",
      muted: "",
      ghost: "",
    },
  },
  defaultVariants: { kind: "piece", tone: "default" },
});

const groupTone = {
  default: "",
  selected: "",
  warning: "",
  muted: "opacity-50",
  ghost: "opacity-50",
};

function bodyKind({ element }: { element: FloorDrawingElement }) {
  if (element.shape === "ZONE") return "zone" as const;
  if (element.shape === "SEAT_ROW") return "row" as const;
  return element.fixed ? ("fixed" as const) : ("piece" as const);
}

function Body({ element }: { element: FloorDrawingElement }) {
  const { shape, widthCm: w, depthCm: d } = element;
  const kind = bodyKind({ element });
  const tone = element.tone ?? "default";
  const rowTone =
    kind === "row" && tone === "selected" ? "stroke-primary [stroke-dasharray:8_6]" : "";
  const className = cn(floorBodyVariants({ kind, tone }), rowTone);
  if (shape === "ROUND") return <circle className={className} r={w / 2} />;
  const depth = shape === "SEAT_ROW" ? ROW_DEPTH : d;
  return <rect className={className} x={-w / 2} y={-depth / 2} width={w} height={depth} rx={3} />;
}

function Chair({ seat }: { seat: FloorDrawingSeat }) {
  return (
    <g transform={`translate(${seat.x} ${seat.y}) rotate(${seat.rotationDeg})`}>
      <rect
        className="fill-muted stroke-muted-foreground stroke-2"
        x={-CHAIR / 2}
        y={-CHAIR / 2 + 2}
        width={CHAIR}
        height={CHAIR - 6}
        rx={8}
      />
      <line
        className="stroke-muted-foreground stroke-[5] [stroke-linecap:round]"
        x1={-CHAIR / 2 + 4}
        y1={CHAIR / 2}
        x2={CHAIR / 2 - 4}
        y2={CHAIR / 2}
      />
    </g>
  );
}

export type FloorPieceProps = { element: FloorDrawingElement; interactive?: boolean };

/** One piece with its chairs and, for a fixed piece, its keep-clear area. */
export function FloorPiece({ element, interactive = false }: FloorPieceProps) {
  const { xCm, yCm, rotationDeg, widthCm: w, depthCm: d, keepClearCm, label } = element;
  const tone = element.tone ?? "default";
  const opening = element.shape === "DOOR" || element.shape === "WINDOW";
  return (
    <g
      data-slot="floor-piece"
      data-id={interactive ? element.id : undefined}
      tabIndex={interactive ? 0 : undefined}
      role={interactive ? "button" : undefined}
      aria-label={interactive ? element.name : undefined}
      className={cn(groupTone[tone], interactive && "cursor-grab outline-none")}
      transform={`translate(${xCm} ${yCm}) rotate(${rotationDeg})`}
    >
      {keepClearCm && !opening ? (
        <rect
          className="fill-warning/20"
          x={-w / 2 - 20}
          y={d / 2}
          width={w + 40}
          height={keepClearCm}
          rx={8}
        />
      ) : null}
      {element.seats.map((seat) => (
        <Chair key={`${seat.x} ${seat.y}`} seat={seat} />
      ))}
      {opening && element.emergencyExit ? (
        <FloorExitZone widthCm={w} depthCm={d} swingDeg={element.swingDeg ?? 0} />
      ) : null}
      {opening ? (
        <FloorOpening
          kind={element.shape as "DOOR" | "WINDOW"}
          widthCm={w}
          swingDeg={element.swingDeg ?? 0}
          selected={tone === "selected" || tone === "warning"}
          emergencyExit={element.emergencyExit}
        />
      ) : (
        <Body element={element} />
      )}
      {label ? (
        <text
          className="fill-muted-foreground font-sans text-[24px]"
          textAnchor="middle"
          dominantBaseline="central"
          transform={`rotate(${-rotationDeg})`}
          pointerEvents="none"
        >
          {label}
        </text>
      ) : null}
    </g>
  );
}

export type FloorDrawingProps = Omit<ComponentProps<"svg">, "children"> & {
  widthCm: number;
  depthCm: number;
  outline: readonly (readonly [number, number])[];
  /** Fixed parts of the room (drawn muted under a layout's pieces). */
  fixed?: readonly FloorDrawingElement[];
  elements: readonly FloorDrawingElement[];
  interactive?: boolean;
  /** Text over the top wall, e.g. "14 m". */
  widthLabel?: string;
  /** Drawn last, in centimetres (a selection box, a ghost piece). */
  overlay?: ReactNode;
  /** Accessible name of the drawing. */
  title: string;
};

/** A room drawn to scale in centimetres: walls, a metre grid, fixed parts and pieces. */
export function FloorDrawing({
  widthCm,
  depthCm,
  outline,
  fixed = [],
  elements,
  interactive = false,
  widthLabel,
  overlay,
  title,
  className,
  ...props
}: FloorDrawingProps) {
  const points = outline.map(([x, y]) => `${x},${y}`).join(" ");
  const margin = 60;
  const id = useId();
  const grid = `${id}-grid`;
  const walls = `${id}-walls`;
  return (
    <svg
      data-slot="floor-drawing"
      viewBox={`${-margin} ${-margin} ${widthCm + margin * 2} ${depthCm + margin * 2}`}
      className={cn("block select-none", className)}
      {...props}
    >
      <title>{title}</title>
      <defs>
        <pattern id={grid} width={100} height={100} patternUnits="userSpaceOnUse">
          <path className="fill-none stroke-border" d="M50 0V100M0 50H100" strokeWidth={1} />
          <path className="fill-none stroke-border" d="M100 0H0V100" strokeWidth={2} />
        </pattern>
        <clipPath id={walls}>
          <polygon points={points} />
        </clipPath>
      </defs>
      <polygon className="fill-card" points={points} />
      <rect width={widthCm} height={depthCm} fill={`url(#${grid})`} clipPath={`url(#${walls})`} />
      <polygon className="fill-none stroke-foreground stroke-[6]" points={points} />
      {widthLabel ? (
        <text
          className="fill-muted-foreground font-sans text-[24px]"
          x={widthCm / 2}
          y={-22}
          textAnchor="middle"
        >
          {widthLabel}
        </text>
      ) : null}
      {fixed.map((element) => (
        <FloorPiece key={element.id} element={{ ...element, tone: element.tone ?? "muted" }} />
      ))}
      {elements.map((element) => (
        <FloorPiece key={element.id} element={element} interactive={interactive} />
      ))}
      {overlay}
    </svg>
  );
}
