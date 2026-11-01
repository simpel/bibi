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
  ticket_previewLines:
    "planned lines and their issues; the /new/ticket intake shows them (ADR 0081); JSON in chat",
};
