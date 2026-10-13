"use server";

import {
  archiveRoom,
  createRoom,
  type RoomCreateInput,
  type RoomDto,
  type RoomUpdateInput,
  updateRoom,
} from "@okazi/core";
import type { ActionResult } from "@/lib/action-result";
import { runOperation } from "@/server/run-operation";
import { toActionResult } from "@/server/to-action-result";

export type CreateRoomActionInput = { input: RoomCreateInput };
export type UpdateRoomActionInput = { input: RoomUpdateInput };
export type ArchiveRoomActionInput = { id: string };

export async function createRoomAction({
  input,
}: CreateRoomActionInput): Promise<ActionResult<RoomDto>> {
  return toActionResult({ result: await runOperation({ operation: createRoom, input }) });
}

export async function updateRoomAction({
  input,
}: UpdateRoomActionInput): Promise<ActionResult<RoomDto>> {
  return toActionResult({ result: await runOperation({ operation: updateRoom, input }) });
}

export async function archiveRoomAction({
  id,
}: ArchiveRoomActionInput): Promise<ActionResult<RoomDto>> {
  return toActionResult({ result: await runOperation({ operation: archiveRoom, input: { id } }) });
}
