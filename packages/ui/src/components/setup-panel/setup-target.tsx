import { cva } from "class-variance-authority";
import type { ReactNode } from "react";
import { cn } from "../../lib/cn";
import { Card } from "../card/card";
import { Popover, PopoverContent, PopoverTrigger } from "../popover/popover";
import { isSameTarget, type SetupTarget, useSetupSelection } from "./setup-selection";

export const setupTargetVariants = cva("shadow-none transition-shadow", {
  variants: {
    interactive: {
      true: "cursor-pointer hover:border-primary/60 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
      false: "",
    },
    selected: { true: "border-primary ring-2 ring-primary", false: "" },
  },
  defaultVariants: { interactive: false, selected: false },
});

export type SetupTargetCardProps = {
  target: SetupTarget;
  /** Layout and padding of the content, shared by the read-only and the clickable version. */
  contentClassName?: string;
  className?: string;
  /** Rendered inside the card but outside the button (e.g. React Flow handles). */
  before?: ReactNode;
  after?: ReactNode;
  children: ReactNode;
};

/**
 * A card in the setup panel. With a selection it is a button that opens the comment box
 * anchored to it (Enter or Space from the keyboard); without one it is plain text.
 */
export function SetupTargetCard(props: SetupTargetCardProps) {
  const { target, contentClassName, className, before, after, children } = props;
  const selection = useSetupSelection();
  const selected = isSameTarget({ a: selection?.selected ?? null, b: target });
  const close = () => selection?.onSelect({ target: null });
  return (
    <Card
      data-slot="setup-target"
      data-selected={selected || undefined}
      className={cn(setupTargetVariants({ interactive: Boolean(selection), selected }), className)}
    >
      {before}
      {selection ? (
        <Popover
          open={selected}
          onOpenChange={(open) => selection.onSelect({ target: open ? target : null })}
        >
          <PopoverTrigger asChild>
            <button
              type="button"
              className={cn(
                "nodrag nopan pointer-events-auto w-full text-left outline-none",
                contentClassName,
              )}
            >
              {children}
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-80">
            {selection.renderComment({ target, close })}
          </PopoverContent>
        </Popover>
      ) : (
        <div className={contentClassName}>{children}</div>
      )}
      {after}
    </Card>
  );
}
