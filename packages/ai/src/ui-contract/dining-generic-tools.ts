const REASON =
  "table booking setup (rooms, sittings, exceptions, combinations, booking page) is edited under Booking settings (ADR 0119); shown as JSON in chat";

/**
 * Table booking setup tools (ADR 0119), shown with the generic `json` component: the setup
 * lives on `/settings/booking`, and the reservation cards cover the day-to-day results.
 * Part of `GENERIC_UI_TOOLS`.
 */
export const DINING_GENERIC_UI_TOOLS: Readonly<Record<string, string>> = Object.fromEntries(
  [
    "diningRoom_list",
    "diningRoom_get",
    "diningRoom_set",
    "diningService_list",
    "diningService_get",
    "diningService_create",
    "diningService_update",
    "diningService_archive",
    "diningServiceException_list",
    "diningServiceException_set",
    "diningServiceException_delete",
    "tableCombination_list",
    "tableCombination_save",
    "bookingPage_get",
    "bookingPage_update",
  ].map((name) => [name, REASON]),
);
