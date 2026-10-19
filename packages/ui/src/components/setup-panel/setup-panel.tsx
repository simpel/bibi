import { Badge } from "../badge/badge";
import { Card, CardContent } from "../card/card";
import { type PathPhase, PhasePath } from "./phase-path";
import { type SetupSelection, SetupSelectionContext, useSetupSelection } from "./setup-selection";
import { SetupTargetCard } from "./setup-target";

export type SetupPanelLabels = {
  empty: string;
  note: string;
  unsaved: string;
  sell: string;
  path: string;
  /** How to point at an element; shown only when the panel is selectable. */
  hint?: string;
};

export type SetupPanelProps = {
  /** Item type names of the draft; `null` while there is no draft yet. */
  itemTypes: string[] | null;
  phases: PathPhase[];
  labels: SetupPanelLabels;
  /** Makes item types and phases selectable, each with a comment box; read-only without it. */
  selection?: SetupSelection;
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

function SellSection({ itemTypes, label }: { itemTypes: string[]; label: string }) {
  return (
    <section aria-labelledby="setup-sell" className="flex flex-col gap-3">
      <h2 id="setup-sell" className="font-serif text-xl">
        {label}
      </h2>
      <ul className="grid gap-3 sm:grid-cols-2">
        {itemTypes.map((name) => (
          <li key={name}>
            <SetupTargetCard
              target={{ kind: "itemType", name }}
              className="text-sm"
              contentClassName="px-4 py-3"
            >
              {name}
            </SetupTargetCard>
          </li>
        ))}
      </ul>
    </section>
  );
}

function PathSection({ phases, label }: { phases: PathPhase[]; label: string }) {
  const readOnly = useSetupSelection() === null;
  return (
    <section aria-labelledby="setup-path" className="flex flex-col gap-3">
      <h2 id="setup-path" className="font-serif text-xl">
        {label}
      </h2>
      <PhasePath phases={phases} label={label} />
      {readOnly ? (
        <ol className="sr-only">
          {phases.map((phase) => (
            <li key={phase.name}>{phase.name}</li>
          ))}
        </ol>
      ) : null}
    </section>
  );
}

/** The first version in plain words: what you sell, and the phases a request moves through. */
export function SetupPanel({ itemTypes, phases, labels, selection }: SetupPanelProps) {
  if (!itemTypes) return <EmptyState text={labels.empty} />;
  return (
    <SetupSelectionContext value={selection ?? null}>
      <div data-slot="setup-panel" className="flex flex-col gap-8 p-8">
        <SellSection itemTypes={itemTypes} label={labels.sell} />
        <PathSection phases={phases} label={labels.path} />
        {selection && labels.hint ? (
          <p className="-mt-4 text-sm text-muted-foreground">{labels.hint}</p>
        ) : null}
        <footer className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span>{labels.note}</span>
          <Badge variant="outline">{labels.unsaved}</Badge>
        </footer>
      </div>
    </SetupSelectionContext>
  );
}
