import { Button, cn } from "@bibi/ui";
import { PencilIcon } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

export type CornerEditButtonProps = Omit<ComponentProps<typeof Button>, "children" | "size"> & {
  /** What a click edits, e.g. "Edit picture"; also the tooltip. */
  "aria-label": string;
  /** A link instead of a button (`asChild`), e.g. to a layout's editor. */
  children?: ReactNode;
};

/**
 * The round pencil centred on the top-right corner of a card or avatar (its parent is
 * `relative`). Every corner pencil looks the same: the same size, icon and ring.
 */
export function CornerEditButton({
  className,
  children,
  asChild,
  ...props
}: CornerEditButtonProps) {
  return (
    <Button
      type={asChild ? undefined : "button"}
      variant="outline"
      size="icon"
      asChild={asChild}
      className={cn(
        "absolute top-0 right-0 z-10 size-7 translate-x-1/2 -translate-y-1/2 rounded-full bg-background shadow-xs [&_svg]:size-3.5",
        className,
      )}
      {...props}
    >
      {children ?? <PencilIcon />}
    </Button>
  );
}
