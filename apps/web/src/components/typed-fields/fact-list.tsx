import type { ReactNode } from "react";

export type Fact = {
  label: string;
  value: string;
  /** Shown instead of `value` when set, e.g. a link or a person's card; `value` stays the text. */
  node?: ReactNode;
};

export type FactListProps = { facts: readonly Fact[] };

/** Description list of labelled values (detail pages), in two columns; a whole fact is its hover area. */
export function FactList({ facts }: FactListProps) {
  return (
    <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
      {facts.map(({ label, value, node }) => (
        // `group/fact`: hovering anywhere on the fact shows an `EditableFact`'s pencil.
        <div key={`${label}-${value}`} className="group/fact">
          <dt className="text-sm text-muted-foreground">{label}</dt>
          <dd>{node ?? value}</dd>
        </div>
      ))}
    </dl>
  );
}
