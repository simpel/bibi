import { ROUTES } from "@/lib/routes";

/** `/admin/table-booking/<itemId>`: one room's booking settings. */
export function tableBookingRoomRoute({ itemId }: { itemId: string }): string {
  return `${ROUTES.adminTableBooking}/${encodeURIComponent(itemId)}`;
}
