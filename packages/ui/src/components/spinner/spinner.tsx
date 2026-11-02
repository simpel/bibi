import { Loader2Icon } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";

export type SpinnerProps = ComponentProps<"svg"> & {
  /** Accessible name; the caller passes a localized one. */
  label: string;
};

/** Something is on its way (shadcn Spinner), e.g. in a pending button instead of its icon. */
export function Spinner({ label, className, ...props }: SpinnerProps) {
  return (
    <Loader2Icon
      role="status"
      aria-label={label}
      className={cn("size-4 animate-spin", className)}
      {...props}
    />
  );
}
