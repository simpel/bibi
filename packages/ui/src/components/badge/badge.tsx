import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";

export const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center gap-1 whitespace-nowrap rounded-sm border px-2 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        outline: "text-foreground",
        destructive: "border-transparent bg-destructive/15 text-destructive",
        success: "border-transparent bg-success/15 text-success",
        warning: "border-transparent bg-warning/15 text-warning-foreground",
      },
      /** A category color (e.g. an item type), from the categorical chart tokens. */
      hue: {
        none: "",
        1: "border-transparent bg-chart-1/15 text-foreground",
        2: "border-transparent bg-chart-2/15 text-foreground",
        3: "border-transparent bg-chart-3/20 text-foreground",
        4: "border-transparent bg-chart-4/15 text-foreground",
        5: "border-transparent bg-chart-5/15 text-foreground",
      },
    },
    defaultVariants: { variant: "default", hue: "none" },
  },
);

export type BadgeProps = ComponentProps<"span"> & VariantProps<typeof badgeVariants>;

export function Badge({ className, variant, hue, ...props }: BadgeProps) {
  return (
    <span data-slot="badge" className={cn(badgeVariants({ variant, hue }), className)} {...props} />
  );
}
