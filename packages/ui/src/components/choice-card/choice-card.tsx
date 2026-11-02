import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "../../lib/cn";

export const choiceCardVariants = cva(
  "grid content-start gap-1.5 rounded-lg border bg-card p-3 text-left text-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      selected: { true: "border-primary bg-accent", false: "border-border" },
    },
    defaultVariants: { selected: false },
  },
);

export type ChoiceCardProps = Omit<ComponentProps<"button">, "title"> &
  VariantProps<typeof choiceCardVariants> & {
    title: ReactNode;
  };

/** One answer among several shown as cards (a package, a one-off): pressed when selected. */
export function ChoiceCard({ className, selected, title, children, ...props }: ChoiceCardProps) {
  return (
    <button
      type="button"
      data-slot="choice-card"
      aria-pressed={selected ?? false}
      className={cn(choiceCardVariants({ selected }), className)}
      {...props}
    >
      <span className="font-medium">{title}</span>
      {children}
    </button>
  );
}
