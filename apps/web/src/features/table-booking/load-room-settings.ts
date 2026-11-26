import "server-only";
import {
  type DiningRoomDto,
  type DiningServiceDto,
  getDiningRoom,
  listDiningServices,
  type Result,
} from "@bibi/core";
import { cache } from "react";
import { runOperation } from "@/server/run-operation";

const loadRoomCached = cache(
  (itemId: string): Promise<Result<DiningRoomDto>> =>
    runOperation({ operation: getDiningRoom, input: { itemId } }),
);

/** The room's table booking settings, once per request (header and sections share it). */
export const loadDiningRoom = ({ itemId }: { itemId: string }) => loadRoomCached(itemId);

const loadSittingsCached = cache(
  async (roomItemId: string): Promise<Result<DiningServiceDto[]>> => {
    const result = await runOperation({ operation: listDiningServices, input: { roomItemId } });
    if (!result.ok) return result;
    const active = result.value.items.filter((sitting) => sitting.status === "ACTIVE");
    return { ok: true, value: active };
  },
);

/** The room's active sittings, once per request (three sections read them). */
export const loadSittings = ({ roomItemId }: { roomItemId: string }) =>
  loadSittingsCached(roomItemId);
