const UNTIL_VIEW =
  "floor plans and layouts get a drawing card with the read-only layout view (ADR 0099); shown as JSON until then";

/**
 * The furniture library, floor plans and setup layouts (ADR 0099), shown with the generic `json`
 * component until the read-only drawing card ships. Part of `GENERIC_UI_TOOLS`.
 */
export const FLOOR_PLAN_GENERIC_UI_TOOLS: Readonly<Record<string, string>> = {
  floorElementKind_list: UNTIL_VIEW,
  floorElementKind_get: UNTIL_VIEW,
  floorElementKind_create: UNTIL_VIEW,
  floorElementKind_update: UNTIL_VIEW,
  floorElementKind_archive: UNTIL_VIEW,
  floorElementKind_importTemplate: UNTIL_VIEW,
  floorPlan_get: UNTIL_VIEW,
  floorPlan_save: UNTIL_VIEW,
  setupLayout_get: UNTIL_VIEW,
  setupLayout_create: UNTIL_VIEW,
  setupLayout_save: UNTIL_VIEW,
  setupLayout_archive: UNTIL_VIEW,
};
