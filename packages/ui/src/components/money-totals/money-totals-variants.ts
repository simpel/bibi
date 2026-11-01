import { cva, type VariantProps } from "class-variance-authority";

/** `sm` in a lane header, `md` beside a heading or toolbar, `lg` as a page's headline tiles. */
export const moneyTotalsVariants = cva("", {
  variants: {
    size: {
      sm: "flex flex-wrap items-end gap-x-3",
      md: "flex flex-wrap items-end gap-x-4 gap-y-1",
      lg: "grid grid-cols-[repeat(auto-fit,minmax(8rem,1fr))] gap-3",
    },
  },
  defaultVariants: { size: "md" },
});

export type MoneyTotalsSize = NonNullable<VariantProps<typeof moneyTotalsVariants>["size"]>;

export const moneyTotalVariants = cva("flex min-w-0 flex-col", {
  variants: {
    size: { sm: "", md: "gap-0.5", lg: "gap-1 p-4 shadow-none" },
    /** A rule before every figure but the first; tiles (`lg`) are apart already. */
    divided: { true: "", false: "" },
  },
  compoundVariants: [
    { size: "sm", divided: true, className: "border-l pl-3" },
    { size: "md", divided: true, className: "border-l pl-4" },
  ],
  defaultVariants: { size: "md", divided: false },
});

export const moneyTotalLabelVariants = cva("", {
  variants: {
    size: {
      sm: "sr-only",
      md: "text-xs text-muted-foreground",
      lg: "text-xs text-muted-foreground",
    },
  },
  defaultVariants: { size: "md" },
});

export const moneyTotalAmountVariants = cva("whitespace-nowrap tabular-nums", {
  variants: {
    size: {
      sm: "font-sans text-xs",
      md: "font-sans text-sm font-medium",
      lg: "font-serif text-2xl font-light tracking-tight",
    },
    tone: {
      default: "text-foreground",
      estimate: "text-muted-foreground",
      destructive: "text-destructive",
    },
  },
  defaultVariants: { size: "md", tone: "default" },
});
