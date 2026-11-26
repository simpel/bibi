import "server-only";
import { listDiningRooms } from "@bibi/core";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { runOperation } from "@/server/run-operation";

/**
 * Whether the organization has a room set up for table booking: the sidebar shows Reservations
 * only then. Reading rooms needs `diningSetup:read`, so a caller without it does not see the
 * entry; no read is made for them.
 */
export async function loadHasDiningRooms(): Promise<boolean> {
  const abilities = await getCallerAbilities();
  if (!can({ abilities, permission: "reservation:read" })) return false;
  if (!can({ abilities, permission: "diningSetup:read" })) return false;
  const rooms = await runOperation({ operation: listDiningRooms, input: {} });
  return rooms.ok && rooms.value.items.length > 0;
}
