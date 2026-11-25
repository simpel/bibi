import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";
import { Separator, type SeparatorProps } from "../separator/separator";

export const buttonGroupVariants = cva(
  "flex w-fit items-stretch [&>*]:focus-visible:relative [&>*]:focus-visible:z-10 [&>*]:focus-within:z-10 [&>input]:flex-1 [&_[data-slot=input]]:focus-visible:ring-offset-0",
  {
    variants: {
      orientation: {
        horizontal:
          "[&>*:not(:first-child)]:rounded-l-none [&>*:not(:first-child)]:border-l-0 [&>*:not(:last-child)]:rounded-r-none",
        vertical:
          "flex-col [&>*:not(:first-child)]:rounded-t-none [&>*:not(:first-child)]:border-t-0 [&>*:not(:last-child)]:rounded-b-none",
      },
    },
    defaultVariants: { orientation: "horizontal" },
  },
);

export type ButtonGroupProps = ComponentProps<"div"> & VariantProps<typeof buttonGroupVariants>;

/** Controls joined into one (shadcn Button Group): an input with its button, or buttons in a row. */
export function ButtonGroup({ className, orientation, ...props }: ButtonGroupProps) {
  return (
    // biome-ignore lint/a11y/useSemanticElements: a fieldset would add a border and a legend.
    <div
      role="group"
      data-slot="button-group"
      data-orientation={orientation ?? "horizontal"}
      className={cn(buttonGroupVariants({ orientation }), className)}
      {...props}
    />
  );
}

export type ButtonGroupSeparatorProps = SeparatorProps;

/**
 * A line between two joined buttons (shadcn Button Group), so a split button reads as two
 * areas. Defaults to the input border; pass a colour for filled buttons.
 */
export function ButtonGroupSeparator({
  className,
  orientation = "vertical",
  ...props
}: ButtonGroupSeparatorProps) {
  return (
    <Separator
      data-slot="button-group-separator"
      orientation={orientation}
      className={cn(
        "relative m-0! self-stretch bg-input data-[orientation=vertical]:h-auto",
        className,
      )}
      {...props}
    />
  );
}
