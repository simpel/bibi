import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn";

export const behaviourDisplayVariants = cva("grid text-sm", {
  variants: {
    density: { compact: "gap-0.5", comfortable: "gap-1.5" },
  },
  defaultVariants: { density: "compact" },
});

export type BehaviourRow = { label?: string; value: string };

export type BehaviourDisplayProps = VariantProps<typeof behaviourDisplayVariants> & {
  /** Which behaviour the rows belong to (`PRICED`, `BOOKABLE`, ...). */
  behaviour: string;
  /** Localised section title. */
  title: string;
  rows: readonly BehaviourRow[];
  className?: string;
};

/** Read-only block for one item behaviour; renders nothing when there are no rows. */
export function BehaviourDisplay({
  behaviour,
  title,
  rows,
  density,
  className,
}: BehaviourDisplayProps) {
  if (rows.length === 0) return null;
  return (
    <section
      data-slot="behaviour-display"
      data-behaviour={behaviour}
      className={cn(behaviourDisplayVariants({ density }), className)}
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
