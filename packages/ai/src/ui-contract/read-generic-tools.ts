/**
 * Reads whose result is a document, a unit list or a plan rather than a record, shown with the
 * generic `json` component (with the reason). Part of `GENERIC_UI_TOOLS`; kept apart so the
 * registry fits its file.
 */
export const READ_GENERIC_UI_TOOLS: Readonly<Record<string, string>> = {
  accountMapping_list:
    "purposes mapped to the connected ledger's accounts; the provider's settings page edits them (ADR 0123); JSON in chat",
  accountMapping_set:
    "the mapping list after one change; the provider's settings page shows it (ADR 0123); JSON in chat",
  integration_accounts:
    "the accounts read from the connected ledger; the provider's settings page lists them (ADR 0123); JSON in chat",
  item_freeUnits:
    "a list of unit names with the prepick; shown as JSON until the allocation UI (#384)",
  item_summary:
    "item counts per type for one venue; the venue page shows them as its items summary; " +
    "JSON in chat",
  skill_export: "SKILL.md text; shown as code/JSON",
  order_export: "versioned JSON document for handover; shown as code/JSON",
  customer_findSimilar:
    "possible duplicates with their match reasons; the /new/order intake shows them (ADR 0081); JSON in chat",
  inboundEndpoint_list:
    "the inbox and API addresses; the inbox page shows them (ADR 0085); JSON in chat",
  inboundMessage_openCount: "the number is the sidebar's inbox badge (ADR 0085), not a tool card",
  inboundMessage_submit:
    "never offered to the assistant (aiAllowed: false): outside callers hand messages in",
  line_amounts:
    "line amounts and the order total; the order page's lines table shows them; JSON in chat",
  line_issues:
    "a saved order's line issues; the order page shows one alert per issue; JSON in chat",
  line_checkHours:
    "whether a planned line falls outside opening hours; the line form asks to confirm before " +
    "saving; JSON in chat",
  order_previewLines:
    "planned lines and their issues; the /new/order intake shows them (ADR 0081); JSON in chat",
  creditNote_list:
    "credit notes with their frozen lines; the order page's invoice rows show each one, and " +
    "invoice_credit shows the credit-note-card; JSON in chat",
  creditNote_get:
    "one credit note with its frozen lines; the order page's invoice rows show it; JSON in chat",
  venue_hoursList:
    "several venues' hours at once for the calendar page (ADR 0097); venueHours_get shows one " +
    "venue's hours as a card; JSON in chat",
  orderDraft_fromMessage:
    "a draft the intake-from-message skill turns into questions and an order.create card; " +
    "the /new/order step 0 shows it (ADR 0084); JSON in chat",
  pipeline_cues:
    "card cues for a set of orders; the order table and the pipeline cards show them; JSON in chat",
  orderVersion_list:
    "an order's versions (ADR 0116); the order page's Versions section shows them; JSON in chat",
  orderVersion_get:
    "one version and its changes against the order now; the order page's restore dialog shows " +
    "it (ADR 0116); JSON in chat",
  orderVersion_name:
    "names a version (ADR 0116); the order page's Versions section shows it; read out, JSON",
  orderVersion_restore:
    "restores the order to a version (ADR 0116); the order page's program shows the result; " +
    "read out, JSON",
};
