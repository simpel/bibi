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
  line_amounts:
    "line amounts and the ticket total; the ticket page's lines table shows them; JSON in chat",
  line_issues:
    "a saved ticket's line issues; the ticket page shows one alert per issue; JSON in chat",
  ticket_previewLines:
    "planned lines and their issues; the /new/ticket intake shows them (ADR 0081); JSON in chat",
  ticketDraft_fromMessage:
    "a draft the intake-from-message skill turns into questions and a ticket.create card; " +
    "the /new/ticket step 0 shows it (ADR 0084); JSON in chat",
};
