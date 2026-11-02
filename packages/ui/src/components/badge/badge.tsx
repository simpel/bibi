import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";

export const badgeVariants = cva(
  // shadcn's badge: icons are size-3, links and buttons get its focus ring.
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden whitespace-nowrap rounded-md border px-2 py-0.5 text-xs font-medium transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 [&>svg]:pointer-events-none [&>svg]:size-3",
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

export type BadgeProps = ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean };

export function Badge({ className, variant, hue, asChild = false, ...props }: BadgeProps) {
  const Comp = asChild ? Slot.Root : "span";
  return (
    <Comp data-slot="badge" className={cn(badgeVariants({ variant, hue }), className)} {...props} />
  );
}
