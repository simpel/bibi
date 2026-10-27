import type { SheetDto } from "@bibi/core";
import { getTranslations } from "next-intl/server";
import { getDateTimeFormat } from "@/server/date-time-format";
import { GenerateSheetButton } from "./generate-sheet-button";
import { SendSheetButton } from "./send-sheet-button";
import { SheetMatches } from "./sheet-matches";
import { SheetRowsView } from "./sheet-rows-view";
import { SheetStatus } from "./sheet-status";

export type SheetPanelProps = {
  ticketId: string;
  definition: { id: string; name: string };
  /** The newest version for the ticket, or null before the first one. */
  sheet: SheetDto | null;
  canGenerate: boolean;
  canSend: boolean;
};

/** One sheet definition on the ticket page: its newest version and the way to the next. */
export async function SheetPanel({
  ticketId,
  definition,
  sheet,
  canGenerate,
  canSend,
}: SheetPanelProps) {
  const [t, dates] = await Promise.all([getTranslations("sheet"), getDateTimeFormat()]);
  return (
    <article data-slot="sheet-panel" className="grid gap-3 rounded-lg border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-medium">{definition.name}</h3>
        <div className="flex gap-2">
          {canGenerate ? (
            <GenerateSheetButton ticketId={ticketId} sheetDefinitionId={definition.id} />
          ) : null}
          {canSend && sheet && !sheet.sentAt && !sheet.blocked ? (
            <SendSheetButton id={sheet.id} />
          ) : null}
        </div>
      </div>
      {sheet ? (
        <>
          <SheetStatus sheet={sheet} dates={dates} />
          <SheetMatches matches={sheet.matches} />
          <SheetRowsView content={sheet.content} changes={sheet.changes} dates={dates} />
        </>
      ) : (
        <p className="text-sm text-muted-foreground">{t("noVersion")}</p>
      )}
    </article>
  );
}
