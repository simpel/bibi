"use client";

import { FloorDrawing, type FloorDrawingElement } from "@bibi/ui";
import { useId } from "react";
import type { FloorBlock, FloorTable } from "../lib/floor-model";

export type FloorPlanData = {
  widthCm: number;
  depthCm: number;
  outline: readonly (readonly [number, number])[];
  fixed: readonly FloorDrawingElement[];
  tables: readonly FloorTable[];
  /** Drawn but not tables (zones, seat rows): shown under the tables. */
  others: readonly FloorDrawingElement[];
};

export type FloorPlanPanelProps = {
  title: string;
  plan: FloorPlanData;
  /** The tables with their tone at the chosen time. */
  elements: readonly FloorDrawingElement[];
  /** Blocks in force at the chosen time. */
  blocks: readonly FloorBlock[];
  /** Tables of the reservation selected in the list: outlined so they are easy to find. */
  highlighted: ReadonlySet<string>;
  onClick: (event: React.MouseEvent<SVGSVGElement>) => void;
};

type OverlayProps = {
  tables: readonly FloorTable[];
  blocks: readonly FloorBlock[];
  highlighted: ReadonlySet<string>;
  hatch: string;
};

type ShapeProps = { table: FloorDrawingElement; className: string; fill?: string | undefined };

function Shape({ table, className, fill }: ShapeProps) {
  return (
    <g transform={`translate(${table.xCm} ${table.yCm}) rotate(${table.rotationDeg})`}>
      {table.shape === "ROUND" ? (
        <circle r={table.widthCm / 2 + 8} fill={fill} className={className} strokeWidth={8} />
      ) : (
        <rect
          x={-table.widthCm / 2 - 8}
          y={-table.depthCm / 2 - 8}
          width={table.widthCm + 16}
          height={table.depthCm + 16}
          rx={8}
          fill={fill}
          className={className}
          strokeWidth={8}
        />
      )}
    </g>
  );
}

/** Hatched where nobody may book, dashed where only staff may, a halo on the selected tables. */
function Overlay({ tables, blocks, highlighted, hatch }: OverlayProps) {
  return (
    <g pointerEvents="none">
      <defs>
        <pattern
          id={hatch}
          width={24}
          height={24}
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <line x1={0} y1={0} x2={0} y2={24} className="stroke-destructive" strokeWidth={6} />
        </pattern>
      </defs>
      {blocks.map((block) => {
        const table = tables.find((one) => one.id === block.tableId)?.drawing;
        if (!table) return null;
        return block.kind === "ONLINE_ONLY" ? (
          <Shape
            key={block.id}
            table={table}
            fill="none"
            className="stroke-primary [stroke-dasharray:14_10]"
          />
        ) : (
          <Shape
            key={block.id}
            table={table}
            fill={`url(#${hatch})`}
            className="stroke-destructive"
          />
        );
      })}
      {tables
        .filter((table) => highlighted.has(table.id))
        .map((table) => (
          <Shape key={table.id} table={table.drawing} className="fill-primary/20 stroke-primary" />
        ))}
    </g>
  );
}

/** The layout drawn read-only and scaled to fit the room it is given (ADR 0119). */
export function FloorPlanPanel({
  title,
  plan,
  elements,
  blocks,
  highlighted,
  onClick,
}: FloorPlanPanelProps) {
  const hatch = useId();
  return (
    <FloorDrawing
      title={title}
      widthCm={plan.widthCm}
      depthCm={plan.depthCm}
      outline={plan.outline}
      fixed={plan.fixed}
      elements={[...plan.others, ...elements]}
      interactive
      onClick={onClick}
      className="size-full rounded-lg border bg-card"
      overlay={
        <Overlay tables={plan.tables} blocks={blocks} highlighted={highlighted} hatch={hatch} />
      }
    />
  );
}
