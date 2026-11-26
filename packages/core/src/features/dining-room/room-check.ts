import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { checkSetupsItem } from "../floor-plan/plan-load";
import { checkReadable } from "../order/order-rules";

export type CheckRoomInput = {
  context: Pick<OperationContext, "db" | "permissions">;
  itemId: string;
  path?: string;
};

/**
 * A room input of the table booking setup (ADR 0119): the caller may read items, and the item
 * exists and has setups (a floor plan and layouts).
 */
export async function checkRoomItem({
  context,
  itemId,
  path = "itemId",
}: CheckRoomInput): Promise<Result<true>> {
  const readable = checkReadable({ context, permission: "item:read", path });
  if (!readable.ok) return readable;
  const room = await checkSetupsItem({ context, itemId });
  return room.ok ? ok({ value: true }) : room;
}
