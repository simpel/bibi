import type { WebSurface } from "./web-surfaces";

const PAGE = "/admin/table-booking";
const ROOM = "/admin/table-booking/[itemId]";

/** Table booking setup (ADR 0119): the administration page and one room's settings page. */
export const TABLE_BOOKING_SURFACES: readonly WebSurface[] = [
  { operation: "bookingPage.get", route: PAGE },
  { operation: "bookingPage.update", route: PAGE },
  { operation: "diningRoom.list", route: PAGE },
  { operation: "diningRoom.set", route: PAGE },
  { operation: "diningRoom.get", route: ROOM },
  { operation: "diningService.list", route: ROOM },
  { operation: "diningService.create", route: ROOM },
  { operation: "diningService.update", route: ROOM },
  { operation: "diningService.archive", route: ROOM },
  { operation: "diningServiceException.list", route: ROOM },
  { operation: "diningServiceException.set", route: ROOM },
  { operation: "diningServiceException.delete", route: ROOM },
  { operation: "tableCombination.list", route: ROOM },
  { operation: "tableCombination.save", route: ROOM },
];
