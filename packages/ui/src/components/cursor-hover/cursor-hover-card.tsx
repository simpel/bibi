"use client";

import { type ComponentProps, type ReactNode, useState } from "react";
import { cn } from "../../lib/cn";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "../hover-card/hover-card";

export type CursorHoverCardProps = {
  children: ReactNode;
  content: ReactNode;
  disabled?: boolean;
  asChild?: boolean;
  className?: string;
  side?: ComponentProps<typeof HoverCardContent>["side"];
  align?: ComponentProps<typeof HoverCardContent>["align"];
  sideOffset?: number;
};

/**
 * A floating card that reveals details on hover, anchored with viewport collision clamping.
 * Allows smooth mouse transition into the card so action buttons (pin, visit) can be clicked.
 */
export function CursorHoverCard({
  children,
  content,
  disabled,
  asChild = true,
  className,
  side = "top",
  align = "center",
  sideOffset = 8,
}: CursorHoverCardProps) {
  const [open, setOpen] = useState(false);

  if (disabled || !content) return <>{children}</>;

  return (
    <HoverCard open={open} onOpenChange={setOpen} openDelay={150} closeDelay={120}>
      <HoverCardTrigger
        asChild={asChild}
        onPointerUp={(event) => {
          if (event.pointerType !== "mouse") setOpen(true);
        }}
        onClick={(event) => {
          const touch =
            "pointerType" in event.nativeEvent && event.nativeEvent.pointerType === "touch";
          if (!touch) setOpen(false);
        }}
      >
        {children}
      </HoverCardTrigger>
      <HoverCardContent
        side={side}
        align={align}
        sideOffset={sideOffset}
        collisionPadding={16}
        avoidCollisions={true}
        className={cn(
          "w-[23.5rem] max-w-[calc(100vw-2rem)] rounded-xl border bg-popover/95 p-3.5 text-popover-foreground shadow-2xl backdrop-blur-md",
          className,
        )}
      >
        {content}
      </HoverCardContent>
    </HoverCard>
  );
}
