import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";

/**
 * Width tiers of a contained page (ADR 0038). Full-width pages (the calendar, the assistant home)
 * are not containers: they live in the app's `(canvas)` route group.
 */
export const pageContainerVariants = cva("mx-auto w-full", {
  variants: {
    width: {
      narrow: "max-w-2xl",
      default: "max-w-5xl",
      wide: "max-w-7xl",
    },
    gutter: {
      true: "px-4 py-4 sm:px-6 sm:py-6",
      false: "",
    },
  },
  defaultVariants: { width: "default", gutter: true },
});

export type PageContainerProps = ComponentProps<"div"> & VariantProps<typeof pageContainerVariants>;

/** Centres page content at one of three widths and supplies the page gutter. A page that needs a
 * narrower tier than its layout nests one with `gutter={false}`. */
export function PageContainer({ className, width, gutter, ...props }: PageContainerProps) {
  return (
    <div
      data-slot="page-container"
      className={cn(pageContainerVariants({ width, gutter }), className)}
      {...props}
    />
  );
}
