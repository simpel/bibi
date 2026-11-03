import "server-only";
import { getWorkOrder, ok, type Result } from "@bibi/core";
import { runOperation } from "@/server/run-operation";
import { loadWorkOrderViews, type WorkOrderViewData } from "./load-work-order-views";

/** One work order version with what its page shows (`loadWorkOrderViews`). */
export async function loadWorkOrderDocument({
  id,
}: {
  id: string;
}): Promise<Result<WorkOrderViewData>> {
  const found = await runOperation({ operation: getWorkOrder, input: { id } });
  if (!found.ok) return found;
  const views = await loadWorkOrderViews({ workOrders: [found.value] });
  if (!views.ok) return views;
  const [view] = views.value;
  return ok({ value: view ?? { workOrder: found.value, name: null, fields: [], versions: [] } });
}
