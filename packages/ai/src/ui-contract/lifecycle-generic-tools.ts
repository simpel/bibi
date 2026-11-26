const REASON =
  "a permanent delete returns only the deleted record's id (ADR 0118); shown as JSON in chat";

/**
 * `<entity>_delete` tools (ADR 0118): the result is just the id of the record that is gone, so
 * there is no card to show. Part of `GENERIC_UI_TOOLS`.
 */
export const LIFECYCLE_GENERIC_UI_TOOLS: Readonly<Record<string, string>> = {
  customer_delete: REASON,
  entityType_delete: REASON,
  item_delete: REASON,
  itemTypeGroup_delete: REASON,
  order_delete: REASON,
  orderStatus_delete: REASON,
  orderTemplate_delete: REASON,
  priceList_delete: REASON,
  responsibility_delete: REASON,
  runSheetDefinition_delete: REASON,
  skill_delete: REASON,
  task_delete: REASON,
  venue_delete: REASON,
  vocabulary_delete: REASON,
  archive_list:
    "a plain list of archived records with restore and delete operations; the Archive page in the app shows them as a table",
};
