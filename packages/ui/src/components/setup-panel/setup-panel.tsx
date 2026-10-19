import { Badge } from "../badge/badge";
import { Card, CardContent } from "../card/card";
import { type PathPhase, PhasePath } from "./phase-path";

export type SetupPanelLabels = {
  empty: string;
  note: string;
  unsaved: string;
  sell: string;
  path: string;
};

export type SetupPanelProps = {
  /** Item type names of the draft; `null` while there is no draft yet. */
  itemTypes: string[] | null;
  phases: PathPhase[];
  labels: SetupPanelLabels;
};

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex h-full items-center justify-center p-8">
      <Card className="max-w-sm border-dashed">
        <CardContent className="p-6 text-center text-sm text-muted-foreground">{text}</CardContent>
      </Card>
    </div>
  );
}

/** The first version in plain words: what you sell, and the phases a request moves through. */
export function SetupPanel({ itemTypes, phases, labels }: SetupPanelProps) {
  if (!itemTypes) return <EmptyState text={labels.empty} />;
  return (
    <div data-slot="setup-panel" className="flex flex-col gap-8 p-8">
      <section aria-labelledby="setup-sell" className="flex flex-col gap-3">
        <h2 id="setup-sell" className="font-serif text-xl">
          {labels.sell}
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {itemTypes.map((name) => (
            <li key={name}>
              <Card className="px-4 py-3 text-sm shadow-none">{name}</Card>
            </li>
          ))}
        </ul>
      </section>
      <section aria-labelledby="setup-path" className="flex flex-col gap-3">
        <h2 id="setup-path" className="font-serif text-xl">
          {labels.path}
        </h2>
        <PhasePath phases={phases} label={labels.path} />
        <ol className="sr-only">
          {phases.map((phase) => (
            <li key={phase.name}>{phase.name}</li>
          ))}
        </ol>
      </section>
      <footer className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <span>{labels.note}</span>
        <Badge variant="outline">{labels.unsaved}</Badge>
      </footer>
    </div>
  );
}
