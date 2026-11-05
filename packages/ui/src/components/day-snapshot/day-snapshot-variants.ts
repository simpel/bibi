import { cva } from "class-variance-authority";

export const daySnapshotBlockVariants = cva(
  "absolute h-5 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap rounded-sm px-1 text-xs leading-5",
  {
    variants: {
      tone: {
        /** Another booking's hard hold: subtle gray, so this booking's lines stand out. */
        hard: "bg-muted-foreground/20 text-muted-foreground",
        /** Another booking's soft hold: lighter still, with a dashed edge. */
        soft: "border border-dashed border-muted-foreground/40 bg-muted/60 text-muted-foreground",
        /** This booking's draft line. */
        draft: "border border-dashed border-primary bg-primary/10 text-foreground",
        /** This booking's draft line where it clashes. */
        clash: "border border-dashed border-destructive bg-destructive/10 text-destructive",
        /** This order's saved line (the order page): solid, so the day's others stay dimmed. */
        own: "border border-primary bg-primary/15 text-foreground",
        /** A line that should have a time and has none: striped at 45° across the whole row. */
        missing:
          "border border-warning-foreground/40 text-warning-foreground bg-[repeating-linear-gradient(45deg,transparent_0_6px,color-mix(in_oklab,currentColor_18%,transparent)_6px_12px)]",
      },
    },
    defaultVariants: { tone: "draft" },
  },
);
