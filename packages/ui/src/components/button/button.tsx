import { cva, type VariantProps } from "class-variance-authority";
import { Loader2Icon } from "lucide-react";
import { Slot } from "radix-ui";
import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";
import { Tooltip, TooltipContent, TooltipTrigger } from "../tooltip/tooltip";

export const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground shadow-xs hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        stripe: "bg-brand-stripe text-brand-stripe-foreground shadow-xs hover:bg-brand-stripe/90",
        fortnox:
          "bg-brand-fortnox text-brand-fortnox-foreground shadow-xs hover:bg-brand-fortnox/90",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 gap-1.5 px-3",
        lg: "h-10 px-6",
        icon: "size-9",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export type ButtonProps = ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    /**
     * The tooltip: what a click does now, e.g. "Follow" or "Stop following". An icon button
     * (`size="icon"`) shows its `aria-label` by default; pass a text for a button that shows an
     * icon with little else (a count), or `false` where another tooltip already covers it.
     */
    tooltip?: string | false;
    /**
     * Work started by this button is running (e.g. saving): the button is disabled and busy, and
     * its icon turns into a spinner. A button without an icon only disables.
     */
    pending?: boolean;
  };

/** While pending, hide the button's own icons, and the spinner too when there is no icon. */
const pendingClass =
  "[&>svg:not([data-spinner])]:hidden [&:not(:has(>svg:not([data-spinner])))>[data-spinner]]:hidden";

/**
 * A button. Every icon button has a tooltip saying what clicking it does (its `aria-label`),
 * shown on hover and keyboard focus; the browser's own `title` is dropped so it never shows twice.
 * A pending button shows a spinner in place of its icon.
 */
export function Button({
  className,
  variant,
  size,
  asChild = false,
  tooltip,
  pending = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button";
  const label =
    tooltip === false
      ? undefined
      : (tooltip ?? (size === "icon" ? props["aria-label"] : undefined));
  const { title: _title, ...withoutTitle } = props;
  const button = (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), pending && pendingClass, className)}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      data-pending={pending || undefined}
      {...(label ? withoutTitle : props)}
    >
      {pending && !asChild ? (
        <>
          <Loader2Icon data-spinner aria-hidden className="animate-spin" />
          {children}
        </>
      ) : (
        children
      )}
    </Comp>
  );
  if (!label) return button;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
