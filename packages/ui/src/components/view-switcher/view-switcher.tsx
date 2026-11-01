import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "../../lib/cn";

export const viewSwitcherVariants = cva(
  "inline-flex max-w-full gap-1 overflow-x-auto rounded-xl border bg-muted/60 p-1",
);

export const viewSwitcherItemVariants = cva(
  "group flex min-w-0 shrink-0 items-center gap-3 rounded-lg px-3 py-2 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring sm:px-4 sm:py-2.5",
  {
    variants: {
      active: {
        true: "bg-card text-foreground shadow-sm ring-1 ring-border",
        false: "text-muted-foreground hover:bg-card/60 hover:text-foreground",
      },
    },
    defaultVariants: { active: false },
  },
);

export const viewSwitcherIconVariants = cva(
  "grid size-8 shrink-0 place-items-center rounded-md transition-colors [&_svg]:size-4",
  {
    variants: {
      active: {
        true: "bg-primary text-primary-foreground",
        false: "bg-background text-muted-foreground group-hover:text-foreground",
      },
    },
    defaultVariants: { active: false },
  },
);

export type ViewSwitcherProps = ComponentProps<"nav">;

/**
 * A prominent switch between a few whole views of one page (e.g. dashboards): larger than tabs,
 * each view with an icon and a short line. Items are links; the active one is marked
 * `aria-current="page"`.
 */
export function ViewSwitcher({ className, children, ...props }: ViewSwitcherProps) {
  return (
    <nav data-slot="view-switcher" className={cn(viewSwitcherVariants(), className)} {...props}>
      {children}
    </nav>
  );
}

export type ViewSwitcherItemProps = ComponentProps<"a"> &
  VariantProps<typeof viewSwitcherItemVariants> & {
    /** The child is the app's own link: it gets the classes and the icon and texts inside it. */
    asChild?: boolean;
    icon?: ReactNode;
    label: string;
    /** A short line under the label; hidden on narrow screens. */
    description?: string;
  };

/** One view in a `ViewSwitcher`. */
export function ViewSwitcherItem(props: ViewSwitcherItemProps) {
  const {
    asChild = false,
    active = false,
    icon,
    label,
    description,
    className,
    children,
    ...rest
  } = props;
  const Comp = asChild ? Slot.Root : "a";
  return (
    <Comp
      data-slot="view-switcher-item"
      aria-current={active ? "page" : undefined}
      className={cn(viewSwitcherItemVariants({ active }), className)}
      {...rest}
    >
      {asChild ? <Slot.Slottable>{children}</Slot.Slottable> : null}
      {icon ? <span className={viewSwitcherIconVariants({ active })}>{icon}</span> : null}
      <span className="grid min-w-0">
        <span className="truncate text-sm font-medium">{label}</span>
        {description ? (
          <span className="hidden truncate text-xs text-muted-foreground sm:block">
            {description}
          </span>
        ) : null}
      </span>
    </Comp>
  );
}
