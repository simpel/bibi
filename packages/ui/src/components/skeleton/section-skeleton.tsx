import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";
import { Skeleton } from "./skeleton";

export type SectionSkeletonProps = ComponentProps<"div"> & {
  /** Read by screen readers while the section loads (e.g. "Loading…"). */
  label: string;
  rows?: number;
};

/** Stands in for a page section while it streams in: a heading bar over a few row bars. */
export function SectionSkeleton({ label, rows = 3, className, ...props }: SectionSkeletonProps) {
  return (
    <div
      role="status"
      aria-busy="true"
      data-slot="section-skeleton"
      className={cn("grid grid-cols-1 gap-3", className)}
      {...props}
    >
      <span className="sr-only">{label}</span>
      <Skeleton className="h-6 w-48" />
      {Array.from({ length: rows }, (_, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: placeholder rows have no identity
        <Skeleton key={index} className="h-10 w-full" />
      ))}
    </div>
  );
}
