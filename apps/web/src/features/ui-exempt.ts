/** An operation deliberately without UI, and why. */
export type UiExempt = { operation: string; reason: string };

/** Operations deliberately without UI. Every entry needs a reason; remove it when UI ships. */
export const UI_EXEMPT: readonly UiExempt[] = [
  {
    operation: "assignment.listMine",
    reason:
      "The My work page (#253) shows it; until then the ticket list filters by Assigned to me and Following with its own list operation.",
  },
  {
    operation: "occupancy.get",
    reason:
      "An occupancy has no page of its own: the item page lists them with occupancy.list and edits blocks inline.",
  },
  {
    operation: "programItem.get",
    reason:
      "A program item has no page of its own: the ticket page lists the run schedule with programItem.list and edits it inline.",
  },
  {
    operation: "requirement.get",
    reason:
      "A requirement has no page of its own: the ticket page lists its counts with requirement.list and edits them inline.",
  },
  {
    operation: "sheet.get",
    reason:
      "A sheet version has no page of its own: the ticket page lists the newest version per sheet with sheet.list.",
  },
  {
    operation: "contact.get",
    reason:
      "Contact persons have no page of their own: the customer page lists them with contact.list and edits them inline.",
  },
  {
    operation: "inboundEmail.get",
    reason: "The ticket page shows each received mail in full from inboundEmail.list",
  },
  {
    operation: "payment.get",
    reason:
      "The ticket page shows every payment in full from payment.list; one payment has no page",
  },
  {
    operation: "auditLog.get",
    reason: "The history tab shows every entry in full from auditLog.list; one entry has no page",
  },
  {
    operation: "userPreference.list",
    reason:
      "No page of its own: pages read the user's preferences (e.g. table column order) with loadUserPreferences",
  },
  {
    operation: "userPreference.set",
    reason:
      "No page of its own: UI that remembers a choice (e.g. table column order) saves it with saveUserPreference",
  },
];
