import {
  Button,
  type ButtonProps,
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@bibi/ui";
import { type ReactNode, useState } from "react";

export type FormPopoverProps = {
  /** The trigger's text (or its accessible name with `iconOnly`). */
  label: string;
  title: string;
  icon?: ReactNode;
  /** A narrow trigger that shows only the icon, e.g. "+" between two columns. */
  iconOnly?: boolean;
  variant?: ButtonProps["variant"];
  className?: string;
  children: (input: { close: () => void }) => ReactNode;
};

/** A small form next to its trigger (add column, add status, rename board). */
export function FormPopover(props: FormPopoverProps) {
  const { label, title, icon, iconOnly = false, variant = "outline", className, children } = props;
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={variant}
          size="sm"
          className={className}
          aria-label={iconOnly ? label : undefined}
        >
          {icon}
          {iconOnly ? null : label}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="grid max-h-[80vh] w-80 gap-3 overflow-y-auto">
        <PopoverHeader>
          <PopoverTitle>{title}</PopoverTitle>
        </PopoverHeader>
        {children({ close: () => setOpen(false) })}
      </PopoverContent>
    </Popover>
  );
}
