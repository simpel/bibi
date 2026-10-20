import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn";

export const capabilityDisplayVariants = cva("grid text-sm", {
  variants: {
    density: { compact: "gap-0.5", comfortable: "gap-1.5" },
  },
  defaultVariants: { density: "compact" },
});

export type CapabilityRow = { label?: string; value: string };

export type CapabilityDisplayProps = VariantProps<typeof capabilityDisplayVariants> & {
  /** Which capability the rows belong to (`PRICED`, `BOOKABLE`, ...). */
  capability: string;
  /** Localised section title. */
  title: string;
  rows: readonly CapabilityRow[];
  className?: string;
};

/** Read-only block for one item capability; renders nothing when there are no rows. */
export function CapabilityDisplay({
  capability,
  title,
  rows,
  density,
  className,
}: CapabilityDisplayProps) {
  if (rows.length === 0) return null;
  return (
    <section
      data-slot="capability-display"
      data-capability={capability}
      className={cn(capabilityDisplayVariants({ density }), className)}
    >
      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h4>
      <ul className="grid gap-0.5">
        {rows.map(({ label, value }) => (
          <li key={`${label ?? ""}-${value}`}>
            {label ? <span className="text-muted-foreground">{label}: </span> : null}
            <span className="text-foreground">{value}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
