import { cva, type VariantProps } from "class-variance-authority";

/** `sm` in a lane header, `md` beside a heading or toolbar, `lg` as a page's headline tiles. */
export const moneyTotalsVariants = cva("", {
  variants: {
    size: {
      sm: "grid gap-0.5",
      md: "flex flex-wrap items-end gap-x-4 gap-y-1",
      lg: "grid grid-cols-[repeat(auto-fit,minmax(8rem,1fr))] gap-3",
    },
  },
  defaultVariants: { size: "md" },
});

export type MoneyTotalsSize = NonNullable<VariantProps<typeof moneyTotalsVariants>["size"]>;

export const moneyTotalVariants = cva("flex min-w-0 flex-col", {
  variants: {
    size: {
      sm: "flex-row items-baseline justify-between gap-2",
      md: "gap-0.5",
      lg: "gap-1 p-4 shadow-none",
    },
    /** A rule before every figure but the first, at `md` only: `sm` rows and `lg` tiles stand apart. */
    divided: { true: "", false: "" },
  },
  compoundVariants: [{ size: "md", divided: true, className: "border-l pl-4" }],
  defaultVariants: { size: "md", divided: false },
});

export const moneyTotalLabelVariants = cva(
  "flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground",
  {
    variants: { size: { sm: "", md: "", lg: "" } },
    defaultVariants: { size: "md" },
  },
);

/** The figure's colour key before its label, like a chart legend: what kind of money it is. */
export const moneyTotalDotVariants = cva("size-2 shrink-0 rounded-full", {
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

export const moneyTotalAmountVariants = cva("whitespace-nowrap tabular-nums", {
  variants: {
    size: {
      sm: "font-sans text-xs",
      md: "font-sans text-sm font-medium",
      lg: "font-serif text-2xl font-light tracking-tight",
    },
    /** Amber is too light for text, so a pending amount is muted and its dot carries the colour. */
    tone: {
      neutral: "text-foreground",
      positive: "text-success",
      pending: "text-muted-foreground",
      negative: "text-destructive",
    },
  },
  defaultVariants: { size: "md", tone: "neutral" },
});
