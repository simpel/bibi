import type { ComponentProps, ReactNode } from "react";
import { cn } from "../../lib/cn";

/** The program's mark for something still to fill in: amber stripes at 45°, as on the day view. */
export const MISSING_STRIPES =
  "border border-warning bg-warning/10 bg-[repeating-linear-gradient(45deg,transparent_0_3px,var(--warning)_3px_6px)]";

/** A small striped swatch that says "this is still missing", beside a label. */
export function MissingMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      data-slot="missing-mark"
      className={cn("inline-block size-3 shrink-0 rounded-[3px]", MISSING_STRIPES, className)}
    />
  );
}

export type MissingButtonProps = ComponentProps<"button"> & { children: ReactNode };

/** What is missing, in words, as an amber chip that opens the place to fill it in. */
export function MissingButton({ className, children, ...props }: MissingButtonProps) {
  return (
    <button
      type="button"
      data-slot="missing-button"
      className={cn(
        "inline-flex w-fit shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-md border border-warning/60 bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning-foreground outline-none transition-colors hover:bg-warning/20 focus-visible:ring-[3px] focus-visible:ring-ring/50",
        className,
      )}
      {...props}
    >
      <MissingMark />
      {children}
    </button>
  );
}

export type MissingFieldProps = {
  /** Set: the fields are framed in amber with this hint above them; unset: drawn as they are. */
  hint?: string | undefined;
  children: ReactNode;
  className?: string;
};

/** Frames form fields that still need a value, in the program's colour for "missing". */
export function MissingField({ hint, children, className }: MissingFieldProps) {
  if (!hint) return <div className={cn("grid gap-4", className)}>{children}</div>;
  return (
    <div
      data-slot="missing-field"
      className={cn("grid gap-3 rounded-lg border border-warning/60 bg-warning/5 p-3", className)}
    >
      <p className="flex items-center gap-2 text-sm font-medium text-warning-foreground">
        <MissingMark />
        {hint}
      </p>
      {children}
    </div>
  );
}
