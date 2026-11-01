import { CalendarIcon } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";
import { Button } from "../button/button";

export type DatePickerTriggerProps = Omit<ComponentProps<typeof Button>, "children"> & {
  /** The chosen date or span, written in the user's date format; empty shows the placeholder. */
  label: string;
  placeholder: string;
};

/** The one button every date and date range opens its calendar from. */
export function DatePickerTrigger({
  label,
  placeholder,
  className,
  ...props
}: DatePickerTriggerProps) {
  return (
    <Button
      type="button"
      variant="outline"
      className={cn(
        "justify-start font-normal tabular-nums",
        !label && "text-muted-foreground",
        className,
      )}
      {...props}
    >
      <CalendarIcon aria-hidden />
      <span className="truncate">{label || placeholder}</span>
    </Button>
  );
}
