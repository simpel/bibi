import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";

export const colorSwatchVariants = cva(
  "inline-block shrink-0 rounded-full border border-border align-middle",
  {
    variants: {
      size: { sm: "size-2.5", md: "size-4" },
    },
    defaultVariants: { size: "sm" },
  },
);

export type ColorSwatchProps = Omit<ComponentProps<"span">, "color"> &
  VariantProps<typeof colorSwatchVariants> & {
    /** A color the organization chose as data (e.g. a booking status's `#22c55e`), not a token. */
    color: string;
  };

/** A small dot in an organization-defined color, shown next to the label it belongs to. */
export function ColorSwatch({ className, size, color, style, ...props }: ColorSwatchProps) {
  return (
    <span
      data-slot="color-swatch"
      aria-hidden
      className={cn(colorSwatchVariants({ size }), className)}
      style={{ ...style, backgroundColor: color }}
      {...props}
    />
  );
}
