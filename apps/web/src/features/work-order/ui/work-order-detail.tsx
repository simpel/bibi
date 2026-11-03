import type { Locale } from "@bibi/i18n";
import { ErrorState } from "@/components/states/error-state";
import { getDateTimeFormat } from "@/server/date-time-format";
import { handleLoadError } from "@/server/load-error";
import { loadWorkOrderDocument } from "../load-work-order-document";
import { WorkOrderView } from "./work-order-view";

export type WorkOrderDetailProps = { locale: Locale; id: string };

/** The page of one work order version: `WorkOrderView` on its own. */
export async function WorkOrderDetail({ locale, id }: WorkOrderDetailProps) {
  const [dates, loaded] = await Promise.all([getDateTimeFormat(), loadWorkOrderDocument({ id })]);
  if (!loaded.ok) return <ErrorState errorKey={handleLoadError({ error: loaded.error, locale })} />;
  return <WorkOrderView {...loaded.value} dates={dates} standalone />;
}
