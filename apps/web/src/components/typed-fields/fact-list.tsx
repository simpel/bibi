import type { ReactNode } from "react";

export type Fact = {
  label: string;
  value: string;
  /** Shown instead of `value` when set, e.g. a link or a person's card; `value` stays the text. */
  node?: ReactNode;
};

export type FactListProps = { facts: readonly Fact[] };

/** Description list of labelled values (detail pages), in two columns. */
export function FactList({ facts }: FactListProps) {
  return (
    <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
      {facts.map(({ label, value, node }) => (
        <div key={`${label}-${value}`}>
          <dt className="text-sm text-muted-foreground">{label}</dt>
          <dd>{node ?? value}</dd>
        </div>
      ))}
    </dl>
  );
}
