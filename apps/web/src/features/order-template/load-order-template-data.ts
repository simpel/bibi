import "server-only";
import { listOrderStatuses, type Result } from "@bibi/core";
import { loadCustomisableItems } from "@/features/line/customisable-items";
import { loadEntityTypesOf } from "@/server/load-entity-types";
import { loadPickerItems } from "@/server/load-items-for-pickers";
import { runOperation } from "@/server/run-operation";
import type { OrderTemplateFormData } from "./ui/order-template-form-data";

const LIMIT = 100;

/**
 * What the template form picks from: order types, line types, the statuses an order can
 * start in (not closing) and the catalog's items with their customisation groups (ADR 0089).
 * Items are optional: without read access the lines have no item to pick.
 */
export async function loadOrderTemplateData(): Promise<Result<OrderTemplateFormData>> {
  const [orderTypes, lineTypes, statuses, items, customisable] = await Promise.all([
    loadEntityTypesOf({ base: "ORDER" }),
    loadEntityTypesOf({ base: "LINE" }),
    runOperation({ operation: listOrderStatuses, input: { limit: LIMIT } }),
    loadPickerItems(),
    loadCustomisableItems(),
  ]);
  if (!orderTypes.ok) return orderTypes;
  if (!lineTypes.ok) return lineTypes;
  if (!statuses.ok) return statuses;
  const named = ({ id, name }: { id: string; name: string }) => ({ id, name });
  return {
    ok: true,
    value: {
      orderTypes: orderTypes.value.items.map(named),
      lineTypes: lineTypes.value.items.map(named),
      statuses: statuses.value.items
        .filter(({ closes }) => !closes)
        .map(({ id, name, color }) => ({ id, name, color })),
      items: items.ok ? items.value.items.map(named) : [],
      itemsHidden: !items.ok,
      customisable,
    },
  };
}
