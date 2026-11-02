/**
 * Reads whose result is a document, a unit list or a plan rather than a record, shown with the
 * generic `json` component (with the reason). Part of `GENERIC_UI_TOOLS`; kept apart so the
 * registry fits its file.
 */
export const READ_GENERIC_UI_TOOLS: Readonly<Record<string, string>> = {
  item_freeUnits:
    "a list of unit names with the prepick; shown as JSON until the allocation UI (#384)",
  skill_export: "SKILL.md text; shown as code/JSON",
  ticket_export: "versioned JSON document for handover; shown as code/JSON",
  customer_findSimilar:
    "possible duplicates with their match reasons; the /new/ticket intake shows them (ADR 0081); JSON in chat",
  inboundEndpoint_list:
    "the inbox and API addresses; the inbox page shows them (ADR 0085); JSON in chat",
  inboundMessage_submit:
    "never offered to the assistant (aiAllowed: false): outside callers hand messages in",
  ticket_previewLines:
    "planned lines and their issues; the /new/ticket intake shows them (ADR 0081); JSON in chat",
};
