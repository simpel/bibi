import { cva, type VariantProps } from "class-variance-authority";
import { Clock, type LucideProps, Package, SlidersHorizontal, Tag, Users } from "lucide-react";
import { type ComponentType, createElement, isValidElement, type ReactNode } from "react";
import { cn } from "../../lib/cn";

export const CAPABILITY_ICONS: Record<string, ComponentType<LucideProps>> = {
  PRICED: Tag,
  BOOKABLE: Clock,
  SETUPS: Users,
  BUNDLE: Package,
  CUSTOMISATIONS: SlidersHorizontal,
};

export const capabilityDisplayVariants = cva("text-sm", {
  variants: {
    variant: {
      card: "flex flex-col gap-2 rounded-xl border border-border/70 bg-card p-4 shadow-2xs transition-colors hover:border-border",
      plain: "grid gap-1",
    },
    density: {
      compact: "gap-1",
      comfortable: "gap-2.5",
    },
  },
  defaultVariants: {
    variant: "card",
    density: "compact",
  },
});

export type CapabilityRow = { label?: string; value: string };

export type CapabilityDisplayProps = VariantProps<typeof capabilityDisplayVariants> & {
  /** Which capability the rows belong to (`PRICED`, `BOOKABLE`, ...). */
  capability: string;
  /** Localised section title. */
  title: string;
  rows?: readonly CapabilityRow[];
  children?: ReactNode;
  icon?: ComponentType<LucideProps> | ReactNode;
  className?: string;
};

type CapabilityIconProps = Pick<CapabilityDisplayProps, "capability" | "icon">;

function CapabilityIcon({ capability, icon }: CapabilityIconProps) {
  if (isValidElement(icon)) return icon;
  if (typeof icon === "function") return createElement(icon);
  if (icon) return icon;
  const IconComponent = CAPABILITY_ICONS[capability];
  return IconComponent ? <IconComponent className="size-3.5 shrink-0 opacity-70" /> : null;
}

function CapabilityRows({ rows }: Pick<CapabilityDisplayProps, "rows">) {
  return (
    <ul className="grid gap-1">
      {rows?.map(({ label, value }) => (
        <li
          key={`${label ?? ""}-${value}`}
          className={cn(
            "text-sm",
            label
              ? "flex items-center justify-between gap-2"
              : "flex items-center gap-2 text-foreground",
          )}
        >
          {label ? (
            <>
              <span className="text-muted-foreground">{label}</span>
              <span className="font-medium text-foreground tabular-nums">{value}</span>
            </>
          ) : (
            <>
              <span className="size-1.5 shrink-0 rounded-full bg-primary/60" />
              <span className="text-foreground">{value}</span>
            </>
          )}
        </li>
      ))}
    </ul>
  );
}

/** Read-only block for one item capability; renders nothing when there are no rows and no children. */
export function CapabilityDisplay({
  capability,
  title,
  rows,
  children,
  icon: customIcon,
  variant,
  density,
  className,
}: CapabilityDisplayProps) {
  const hasRows = Boolean(rows && rows.length > 0);
  if (!hasRows && !children) return null;

  return (
    <section
      data-slot="capability-display"
      data-capability={capability}
      className={cn(capabilityDisplayVariants({ variant, density }), className)}
    >
      <header className="flex items-center gap-1.5 text-muted-foreground">
        <CapabilityIcon capability={capability} icon={customIcon} />
        <h4 className="font-sans text-[11px] font-semibold tracking-wider uppercase text-muted-foreground">
          {title}
        </h4>
      </header>

      {children ?? <CapabilityRows rows={rows} />}
    </section>
  );
}
