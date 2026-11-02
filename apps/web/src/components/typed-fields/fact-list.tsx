import { cn } from "@bibi/ui";

export type Fact = { label: string; value: string };

export type FactListProps = {
  facts: readonly Fact[];
  /** One wrapping row of small facts (a detail page's primary facts under its title). */
  inline?: boolean;
};

/** Description list of labelled values (detail pages): two columns, or one row when `inline`. */
export function FactList({ facts, inline = false }: FactListProps) {
  return (
    <dl
      className={cn(
        inline ? "flex flex-wrap gap-x-8 gap-y-2" : "grid gap-x-8 gap-y-3 sm:grid-cols-2",
      )}
    >
      {facts.map(({ label, value }) => (
        <div key={`${label}-${value}`}>
          <dt className={cn("text-muted-foreground", inline ? "text-xs" : "text-sm")}>{label}</dt>
          <dd className={cn(inline && "text-sm font-medium")}>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
