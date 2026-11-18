import type { RunSheetDto } from "@bibi/core";
import { getDateTimeFormat } from "@/server/date-time-format";
import { FulfillRunSheetButton } from "./fulfill-run-sheet-button";
import { OpenRunSheetLink } from "./open-run-sheet-link";
import { PublishRunSheetButton } from "./publish-run-sheet-button";
import { RunSheetMatches } from "./run-sheet-matches";
import { RunSheetRowsView } from "./run-sheet-rows-view";
import { RunSheetStatus } from "./run-sheet-status";

export type RunSheetPanelProps = {
  definition: { id: string; name: string };
  /** The newest version for the order. */
  runSheet: RunSheetDto;
  canSend: boolean;
};

/** One run sheet type on the order page: its newest version, to open, publish or mark done. */
export async function RunSheetPanel({ definition, runSheet, canSend }: RunSheetPanelProps) {
  const dates = await getDateTimeFormat();
  return (
    <article data-slot="run-sheet-panel" className="grid gap-3 rounded-lg border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-medium">{definition.name}</h3>
        <div className="flex flex-wrap items-center gap-2">
          <OpenRunSheetLink id={runSheet.id} />
          {canSend && !runSheet.publishedAt && !runSheet.blocked ? (
            <PublishRunSheetButton id={runSheet.id} />
          ) : null}
          {canSend && runSheet.publishedAt && !runSheet.blocked ? (
            <FulfillRunSheetButton id={runSheet.id} fulfilled={Boolean(runSheet.fulfilledAt)} />
          ) : null}
        </div>
      </div>
      <RunSheetStatus runSheet={runSheet} dates={dates} hideVersion />
      <RunSheetMatches matches={runSheet.matches} />
      <RunSheetRowsView content={runSheet.content} changes={runSheet.changes} dates={dates} />
    </article>
  );
}
