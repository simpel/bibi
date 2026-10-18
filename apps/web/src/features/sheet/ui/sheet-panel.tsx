import type { SheetDto } from "@okazi/core";
import { getTranslations } from "next-intl/server";
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
  canWrite: boolean;
};

/** One sheet definition on the ticket page: its newest version and the way to the next. */
export async function SheetPanel({ ticketId, definition, sheet, canWrite }: SheetPanelProps) {
  const t = await getTranslations("sheet");
  return (
    <article data-slot="sheet-panel" className="grid gap-3 rounded-lg border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-medium">{definition.name}</h3>
        {canWrite ? (
          <div className="flex gap-2">
            <GenerateSheetButton ticketId={ticketId} sheetDefinitionId={definition.id} />
            {sheet && !sheet.sentAt && !sheet.blocked ? <SendSheetButton id={sheet.id} /> : null}
          </div>
        ) : null}
      </div>
      {sheet ? (
        <>
          <SheetStatus sheet={sheet} />
          <SheetMatches matches={sheet.matches} />
          <SheetRowsView content={sheet.content} changes={sheet.changes} />
        </>
      ) : (
        <p className="text-sm text-muted-foreground">{t("noVersion")}</p>
      )}
    </article>
  );
}
