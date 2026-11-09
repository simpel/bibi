import { cn } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { type Outline, wallLength } from "../lib/outline-edit";

export type WallHandlesProps = {
  outline: Outline;
  /** The selected corner's index. */
  corner: number | null;
  /** Corners and + handles; false shows only the wall lengths. */
  editable: boolean;
};

/**
 * Drawn over the floor plan, in centimetres: each wall's length outside it and, when editable, a
 * handle on every corner and a + in the middle of every wall that adds a corner there.
 */
export function WallHandles({ outline, corner, editable }: WallHandlesProps) {
  const t = useTranslations("floorPlan.walls");
  const metres = useTranslations("floorPlan");
  const span = Math.max(...outline.flat(), 100);
  const radius = Math.max(8, span / 90);
  const font = Math.max(18, span / 50);
  return (
    <g data-slot="wall-handles">
      {outline.map(([x1, y1], index) => {
        const [x2, y2] = outline[(index + 1) % outline.length] ?? [x1, y1];
        const length = wallLength({ outline, index });
        const [nx, ny] = [(y2 - y1) / (length || 1), (x1 - x2) / (length || 1)];
        const [mx, my] = [(x1 + x2) / 2, (y1 + y2) / 2];
        const value = Math.round(length / 10) / 10;
        return (
          // biome-ignore lint/suspicious/noArrayIndexKey: a wall is its position in the outline
          <g key={`wall-${index}`}>
            <text
              className="fill-muted-foreground font-sans"
              style={{ fontSize: font }}
              x={mx + nx * font * 1.2}
              y={my + ny * font * 1.2}
              textAnchor="middle"
              dominantBaseline="central"
              pointerEvents="none"
            >
              {metres("metres", { value })}
            </text>
            {editable && length > radius * 6 ? (
              // biome-ignore lint/a11y/useSemanticElements: SVG has no button element
              <g
                data-wall={index}
                role="button"
                aria-label={t("addCorner", { wall: index + 1 })}
                className="cursor-copy"
                transform={`translate(${mx} ${my})`}
              >
                <circle className="fill-card stroke-primary" r={radius * 0.9} strokeWidth={2} />
                <path
                  className="stroke-primary"
                  d={`M${-radius / 2} 0H${radius / 2}M0 ${-radius / 2}V${radius / 2}`}
                  strokeWidth={2}
                />
              </g>
            ) : null}
          </g>
        );
      })}
      {editable
        ? outline.map(([x, y], index) => (
            // biome-ignore lint/a11y/useSemanticElements: SVG has no button element
            <circle
              // biome-ignore lint/suspicious/noArrayIndexKey: a corner is its position in the outline
              key={`corner-${index}`}
              data-corner={index}
              role="button"
              aria-label={t("corner", { corner: index + 1 })}
              className={cn(
                "cursor-move stroke-primary",
                corner === index ? "fill-primary" : "fill-card",
              )}
              cx={x}
              cy={y}
              r={radius}
              strokeWidth={3}
            />
          ))
        : null}
    </g>
  );
}
