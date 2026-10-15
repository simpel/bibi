export type Fact = { label: string; value: string };

export type FactListProps = { facts: readonly Fact[] };

/** Two-column description list of labelled values (detail pages). */
export function FactList({ facts }: FactListProps) {
  return (
    <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
      {facts.map(({ label, value }) => (
        <div key={`${label}-${value}`}>
          <dt className="text-sm text-muted-foreground">{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
