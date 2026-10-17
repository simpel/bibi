import type { ElementType } from "react";
import { cn } from "../../lib/cn";

export type ShimmerProps = { children: string; as?: ElementType; className?: string };

/** AI Elements `Shimmer`: animated text for "thinking" and "running" states. */
export function Shimmer({ children, as: Tag = "span", className }: ShimmerProps) {
  return (
    <Tag
      data-slot="shimmer"
      className={cn("animate-pulse text-sm text-muted-foreground", className)}
    >
      {children}
    </Tag>
  );
}
