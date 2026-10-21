import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn";

export const permissionChipVariants = cva("rounded-md px-2 py-0.5 text-xs", {
  variants: {
    tone: {
      neutral: "bg-secondary text-secondary-foreground",
      allow: "bg-primary/10 text-foreground",
      deny: "bg-destructive/10 text-destructive",
    },
  },
  defaultVariants: { tone: "neutral" },
});

export type PermissionChipListProps = VariantProps<typeof permissionChipVariants> & {
  /** Localised section title. */
  title: string;
  /** Already translated chips, e.g. "Items: Edit". */
  chips: readonly string[];
  className?: string;
};

/** A titled group of small labels; renders nothing when there are no chips. */
export function PermissionChipList({ title, chips, tone, className }: PermissionChipListProps) {
  if (chips.length === 0) return null;
  return (
    <section data-slot="permission-chip-list" className={cn("grid gap-1", className)}>
      <h4 className="font-sans text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h4>
      <ul className="flex flex-wrap gap-1">
        {chips.map((chip) => (
          <li key={chip} className={permissionChipVariants({ tone })}>
            {chip}
          </li>
        ))}
      </ul>
    </section>
  );
}
