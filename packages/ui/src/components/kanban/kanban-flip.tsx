import { cva } from "class-variance-authority";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "../../lib/cn";

export const kanbanFlipInnerVariants = cva(
  [
    "grid h-full transform-3d transition-transform duration-500 ease-in-out",
    "motion-reduce:transition-none",
  ],
  {
    variants: { flipped: { true: "rotate-y-180", false: "rotate-y-0" } },
    defaultVariants: { flipped: false },
  },
);

const FACE = "col-start-1 row-start-1 min-h-0 backface-hidden";

export type KanbanFlipProps = Omit<ComponentProps<"div">, "children"> & {
  /** Which face shows: false = `front`, true = `back`. */
  flipped: boolean;
  front: ReactNode;
  back: ReactNode;
};

/**
 * A card that turns over (CSS `rotateY`) to show its back, e.g. a board column turning into its
 * settings. Both faces share one grid cell, so the card is as tall as the taller face. The hidden
 * face is `inert`, so focus and screen readers only reach the face that shows. Instant under
 * `prefers-reduced-motion`.
 */
export function KanbanFlip({ flipped, front, back, className, ...props }: KanbanFlipProps) {
  return (
    <div
      data-slot="kanban-flip"
      data-flipped={flipped || undefined}
      className={cn("perspective-distant", className)}
      {...props}
    >
      <div className={kanbanFlipInnerVariants({ flipped })}>
        <div className={FACE} inert={flipped}>
          {front}
        </div>
        <div className={cn(FACE, "rotate-y-180")} inert={!flipped}>
          {back}
        </div>
      </div>
    </div>
  );
}
