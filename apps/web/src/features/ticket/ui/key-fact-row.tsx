import { cn } from "@bibi/ui";
import type { Fact } from "@/components/typed-fields/fact-list";

export type KeyFact = Fact & { truncate?: boolean };

/**
 * The primary facts in one row, in the stat cards' type without their frame: each as wide as its
 * value, which may wrap; a truncating fact (the customer) gives way first. Links and names that
 * open a card underline on hover.
 */
export function KeyFactRow({ facts }: { facts: readonly KeyFact[] }) {
  return (
    <dl className="flex gap-x-10">
      {facts.map(({ label, value, node, truncate }) => (
        <div key={label} className={cn("grid gap-1", truncate && "min-w-0 shrink-[999]")}>
          <dt className="text-xs text-muted-foreground">{label}</dt>
          <dd
            title={truncate ? value : undefined}
            className={cn(
              "font-serif text-2xl font-light tracking-tight [&_a]:underline-offset-4 [&_a:hover]:underline",
              truncate && "truncate",
            )}
          >
            {node ?? value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
