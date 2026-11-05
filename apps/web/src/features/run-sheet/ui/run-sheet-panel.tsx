import type { RunSheetDto } from "@bibi/core";
import { getTranslations } from "next-intl/server";
import { getDateTimeFormat } from "@/server/date-time-format";
import { FulfillRunSheetButton } from "./fulfill-run-sheet-button";
import { GenerateRunSheetButton } from "./generate-run-sheet-button";
import { OpenRunSheetLink } from "./open-run-sheet-link";
import { PublishRunSheetButton } from "./publish-run-sheet-button";
import { RunSheetMatches } from "./run-sheet-matches";
import { RunSheetRowsView } from "./run-sheet-rows-view";
import { RunSheetStatus } from "./run-sheet-status";

export type RunSheetPanelProps = {
  orderId: string;
  definition: { id: string; name: string };
  /** The newest version for the order, or null before the first one. */
  runSheet: RunSheetDto | null;
  canGenerate: boolean;
  canSend: boolean;
};

/** One run sheet definition on the order page: its newest version and the way to the next. */
export async function RunSheetPanel({
  orderId,
  definition,
  runSheet,
  canGenerate,
  canSend,
}: RunSheetPanelProps) {
  const [t, dates] = await Promise.all([getTranslations("runSheet"), getDateTimeFormat()]);
  return (
    <article data-slot="run-sheet-panel" className="grid gap-3 rounded-lg border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-medium">{definition.name}</h3>
        <div className="flex flex-wrap items-center gap-2">
          {runSheet ? <OpenRunSheetLink id={runSheet.id} /> : null}
          {canGenerate ? (
            <GenerateRunSheetButton orderId={orderId} runSheetDefinitionId={definition.id} />
          ) : null}
          {canSend && runSheet && !runSheet.publishedAt && !runSheet.blocked ? (
            <PublishRunSheetButton id={runSheet.id} />
          ) : null}
          {canSend && runSheet?.publishedAt && !runSheet.blocked ? (
            <FulfillRunSheetButton id={runSheet.id} fulfilled={Boolean(runSheet.fulfilledAt)} />
          ) : null}
        </div>
      </div>
      {runSheet ? (
        <>
          <RunSheetStatus runSheet={runSheet} dates={dates} />
          <RunSheetMatches matches={runSheet.matches} />
          <RunSheetRowsView content={runSheet.content} changes={runSheet.changes} dates={dates} />
        </>
      ) : (
        <p className="text-sm text-muted-foreground">{t("noVersion")}</p>
      )}
    </article>
  );
}
