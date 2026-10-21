import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";

export const wordmarkVariants = cva(
  "inline-flex select-none items-center font-wordmark leading-none tracking-normal text-foreground antialiased",
  {
    variants: {
      size: {
        sm: "text-lg",
        md: "text-2xl",
        lg: "text-3xl",
        xl: "text-4xl",
        "2xl": "text-5xl",
      },
    },
    defaultVariants: {
      size: "md",
    },
  },
);

export type WordmarkProps = ComponentProps<"span"> &
  VariantProps<typeof wordmarkVariants> & {
    name?: string;
  };

/** Wordmark displaying the app name ("Bibi" by default) using the Cherry Bomb One brand font. */
export function Wordmark({
  className,
  size,
  name = "Bibi",
  children = name,
  ...props
}: WordmarkProps) {
  return (
    <span data-slot="wordmark" className={cn(wordmarkVariants({ size }), className)} {...props}>
      {children}
    </span>
  );
}
