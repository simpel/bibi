import { cva } from "class-variance-authority";

export const statCardVariants = cva(
  "relative flex min-w-0 flex-col gap-1 overflow-hidden p-4 shadow-none",
);

export const statCardsVariants = cva("grid grid-cols-[repeat(auto-fit,minmax(10rem,1fr))] gap-3");

export const statCardLabelVariants = cva(
  "relative z-10 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground",
);

export const statCardDotVariants = cva("size-2 shrink-0 rounded-full", {
  variants: {
    tone: {
      neutral: "bg-muted-foreground/50",
      positive: "bg-success",
      pending: "bg-warning",
      negative: "bg-destructive",
    },
  },
  defaultVariants: { tone: "neutral" },
});

/** The line's colour follows the trend; without a trend it is the primary colour. */
export const statCardLineVariants = cva(
  "pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[58%]",
  {
    variants: {
      tone: {
        primary: "text-primary",
        good: "text-success",
        bad: "text-destructive",
        neutral: "text-muted-foreground",
      },
    },
    defaultVariants: { tone: "primary" },
  },
);

export const statCardTrendVariants = cva(
  "relative z-10 ml-auto flex items-center gap-1 text-xs font-medium",
  {
    variants: {
      tone: { good: "text-success", bad: "text-destructive", neutral: "text-muted-foreground" },
    },
    defaultVariants: { tone: "neutral" },
  },
);
