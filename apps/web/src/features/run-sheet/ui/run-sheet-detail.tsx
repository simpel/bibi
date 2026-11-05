import type { Locale } from "@bibi/i18n";
import { CrumbName } from "@/components/shell/crumb-name";
import { ErrorState } from "@/components/states/error-state";
import { getDateTimeFormat } from "@/server/date-time-format";
import { handleLoadError } from "@/server/load-error";
import { loadRunSheetDocument } from "../load-run-sheet-document";
import { RunSheetView } from "./run-sheet-view";

export type RunSheetDetailProps = { locale: Locale; id: string };

/** The page of one run sheet version: `RunSheetView` on its own. */
export async function RunSheetDetail({ locale, id }: RunSheetDetailProps) {
  const [dates, loaded] = await Promise.all([getDateTimeFormat(), loadRunSheetDocument({ id })]);
  if (!loaded.ok) return <ErrorState errorKey={handleLoadError({ error: loaded.error, locale })} />;
  const label = loaded.value.name ?? "Run sheet";
  return (
    <>
      <CrumbName href={`/run-sheets/${id}`} name={label} />
      <RunSheetView {...loaded.value} dates={dates} standalone />
    </>
  );
}
