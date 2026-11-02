import type { ComponentProps, ReactNode } from "react";
import { cn } from "../../lib/cn";

export type StepSectionFooterProps = Omit<ComponentProps<"div">, "children"> & {
  /** Bottom left: going back (a ghost Back button). */
  start?: ReactNode;
  /** Bottom right: going on (Next, Back to review, Create). */
  end?: ReactNode;
};

/**
 * The bottom row of an open step: Back on the left, Next on the right. `StepSection` renders it
 * from `footerStart`/`footerEnd`; content that owns its own Next (inside its form) renders it last.
 */
export function StepSectionFooter({ start, end, className, ...props }: StepSectionFooterProps) {
  if (!start && !end) return null;
  return (
    <div
      data-slot="step-section-footer"
      className={cn("flex flex-wrap items-center justify-between gap-2", className)}
      {...props}
    >
      <div className="flex flex-wrap items-center gap-2">{start}</div>
      <div className="ml-auto flex flex-wrap items-center gap-2">{end}</div>
    </div>
  );
}
