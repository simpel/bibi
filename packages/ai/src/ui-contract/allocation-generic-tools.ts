const UNTIL_UI =
  "demands and allocations get their cards with the allocation UI (#384); shown as JSON until then";

/**
 * Item demands and line allocations (ADR 0059), shown with the generic `json` component until the
 * Resources and Staffing lists ship (#384). Part of `GENERIC_UI_TOOLS`.
 */
export const ALLOCATION_GENERIC_UI_TOOLS: Readonly<Record<string, string>> = {
  itemDemand_list: UNTIL_UI,
  itemDemand_get: UNTIL_UI,
  itemDemand_create: UNTIL_UI,
  itemDemand_update: UNTIL_UI,
  itemDemand_archive: UNTIL_UI,
  lineAllocation_list: UNTIL_UI,
  lineAllocation_get: UNTIL_UI,
  lineAllocation_assign: UNTIL_UI,
};
