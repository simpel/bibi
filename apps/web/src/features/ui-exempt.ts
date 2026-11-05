/** An operation deliberately without UI, and why. */
export type UiExempt = { operation: string; reason: string };

/** Operations deliberately without UI. Every entry needs a reason; remove it when UI ships. */
export const UI_EXEMPT: readonly UiExempt[] = [
  {
    operation: "profile.setLocale",
    reason:
      "Language switching is handled via route locale prefix (/sv, /en); profile.setLocale serves background sync and API clients.",
  },
  {
    operation: "order.export",
    reason:
      "The order page leaves out an export button to keep its header to the daily work; the export serves the API and the assistant.",
  },
  {
    operation: "order.createFromTemplate",
    reason:
      "The intake on /new/order reviews a package's lines and creates them with order.create and templateId (ADR 0081); createFromTemplate serves the API and the assistant.",
  },
  {
    operation: "itemDemand.get",
    reason:
      "A demand has no page of its own: the item page lists them with itemDemand.list and edits them inline; the unit picker reads one to find its pool.",
  },
  {
    operation: "lineAllocation.get",
    reason:
      "An allocation has no page of its own: the unit picker on a booking lists them with lineAllocation.list and changes the unit inline.",
  },
  {
    operation: "changeSet.apply",
    reason:
      "The assistant proposes change sets for requests that need several commands (ADR 0049); every step has its own page in the app.",
  },
  {
    operation: "assignment.listMine",
    reason:
      "The My work page (#253) shows it; until then the order list filters by Assigned to me and Following with its own list operation.",
  },
  {
    operation: "occupancy.get",
    reason:
      "An occupancy has no page of its own: the item page lists them with occupancy.list and edits blocks inline.",
  },
  {
    operation: "line.get",
    reason:
      "A line has no page of its own: the order page lists the run schedule with line.list and edits it inline.",
  },
  {
    operation: "alternativeGroup.get",
    reason:
      "An alternative group has no page of its own: the order page lists them with alternativeGroup.list and chooses inline.",
  },
  {
    operation: "requirement.get",
    reason:
      "A requirement has no page of its own: the order page lists its counts with requirement.list and edits them inline.",
  },
  {
    operation: "contact.get",
    reason:
      "Contact persons have no page of their own: the customer page lists them with contact.list and edits them inline.",
  },
  {
    operation: "inboundEmail.get",
    reason: "Deprecated alias (ADR 0085): the app reads inboundMessage.get and inboundMessage.list",
  },
  {
    operation: "inboundEmail.list",
    reason:
      "Deprecated alias (ADR 0085): the order page lists every channel with inboundMessage.list",
  },
  {
    operation: "inboundMessage.submit",
    reason:
      "The API channel (ADR 0085): outside systems hand requests in over REST or MCP; staff never submit their own",
  },
  {
    operation: "payment.get",
    reason:
      "The order page shows every payment in full from payment.list; one payment has no page",
  },
  {
    operation: "deposit.get",
    reason:
      "The order page shows every deposit request in full from deposit.list; one has no page",
  },
  {
    operation: "invoice.get",
    reason: "The order page shows every invoice from invoice.list; one invoice has no page yet",
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
  {
    operation: "order.expireHolds",
    reason:
      "Expired holds are swept automatically by the background worker every 15 minutes (ADR 0027, 0044); the operation serves the worker and assistant without needing a manual button on the order list.",
  },
];
