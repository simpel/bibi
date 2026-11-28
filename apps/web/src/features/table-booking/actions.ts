"use server";

import {
  archiveDiningService,
  createDiningService,
  deleteDiningServiceException,
  getItem,
  getLayout,
  type LayoutDto,
  saveLayout,
  saveTableCombinations,
  setDiningRoom,
  setDiningServiceException,
  updateBookingPage,
  updateDiningService,
} from "@bibi/core";
import type {
  BookingPageDto,
  BookingPageUpdateInput,
  DiningRoomDto,
  DiningServiceDto,
  DiningServiceExceptionDto,
  TableCombinationDto,
} from "@bibi/core/schemas";
import type { ActionResult } from "@/lib/action-result";
import { runOperation } from "@/server/run-operation";
import { toActionResult } from "@/server/to-action-result";
import { toDraft, toInput } from "../floor-plan/lib/draft";
import type { ExceptionSetInput, SittingActionValues } from "./lib/action-types";
import type { CombinationsSaveInput } from "./lib/combinations-form";
import { endOfDay, startOfDay } from "./lib/edge-time";

export type UpdateBookingPageActionInput = { input: BookingPageUpdateInput };

export async function updateBookingPageAction({
  input,
}: UpdateBookingPageActionInput): Promise<ActionResult<BookingPageDto>> {
  return toActionResult({ result: await runOperation({ operation: updateBookingPage, input }) });
}

export type SetDiningRoomActionInput = {
  itemId: string;
  slug: string;
  /** A rolling window in days from now; null = each sitting's own; undefined = unchanged. */
  openDaysAhead?: number | null | undefined;
  /** The first open local day (`YYYY-MM-DD`); null = no start date; undefined = unchanged. */
  openFromDay?: string | null | undefined;
  /** The last open local day (`YYYY-MM-DD`); null = no limit; undefined = unchanged. */
  openUntilDay?: string | null | undefined;
};

/** The room's zone comes from its item, never from the browser (ADR 0064). */
async function zoneOf({ itemId }: { itemId: string }) {
  const item = await runOperation({ operation: getItem, input: { id: itemId } });
  return item.ok ? ({ ok: true, value: item.value.timeZone } as const) : item;
}

export async function setDiningRoomAction({
  itemId,
  slug,
  openDaysAhead,
  openFromDay,
  openUntilDay,
}: SetDiningRoomActionInput): Promise<ActionResult<DiningRoomDto>> {
  let openFrom: Date | null | undefined;
  let openUntil: Date | null | undefined;
  if (typeof openFromDay === "string" || typeof openUntilDay === "string") {
    const zone = await zoneOf({ itemId });
    if (!zone.ok) return toActionResult({ result: zone });
    openFrom =
      typeof openFromDay === "string"
        ? startOfDay({ day: openFromDay, timeZone: zone.value })
        : openFromDay;
    openUntil =
      typeof openUntilDay === "string"
        ? endOfDay({ day: openUntilDay, timeZone: zone.value })
        : openUntilDay;
  } else {
    openFrom = openFromDay;
    openUntil = openUntilDay;
  }
  const input = {
    ...{ itemId, slug },
    ...(openDaysAhead === undefined ? {} : { openDaysAhead }),
    ...(openFrom === undefined ? {} : { openFrom }),
    ...(openUntil === undefined ? {} : { openUntil }),
  };
  return toActionResult({ result: await runOperation({ operation: setDiningRoom, input }) });
}

export type SaveSittingActionInput = {
  roomItemId: string;
  /** A saved sitting's id; none = create. */
  id?: string | undefined;
  values: SittingActionValues;
};

export async function saveSittingAction({
  roomItemId,
  id,
  values,
}: SaveSittingActionInput): Promise<ActionResult<DiningServiceDto>> {
  const zone = await zoneOf({ itemId: roomItemId });
  if (!zone.ok) return toActionResult({ result: zone });
  const { validFromDate, validUntilDate, ...rest } = values;
  const timeZone = zone.value;
  const season = {
    validFrom: validFromDate ? startOfDay({ day: validFromDate, timeZone }) : null,
    validUntil: validUntilDate ? endOfDay({ day: validUntilDate, timeZone }) : null,
  };
  const result = id
    ? await runOperation({ operation: updateDiningService, input: { id, ...rest, ...season } })
    : await runOperation({
        operation: createDiningService,
        input: { roomItemId, ...rest, ...season },
      });
  return toActionResult({ result });
}

/** Which layout a sitting uses; nothing else about it changes. */
export async function setSittingLayoutAction({
  id,
  layoutId,
}: {
  id: string;
  layoutId: string;
}): Promise<ActionResult<DiningServiceDto>> {
  return toActionResult({
    result: await runOperation({ operation: updateDiningService, input: { id, layoutId } }),
  });
}

export async function archiveSittingAction({
  id,
}: {
  id: string;
}): Promise<ActionResult<DiningServiceDto>> {
  return toActionResult({
    result: await runOperation({ operation: archiveDiningService, input: { id } }),
  });
}

export async function setExceptionAction({
  input,
}: {
  input: ExceptionSetInput;
}): Promise<ActionResult<DiningServiceExceptionDto>> {
  return toActionResult({
    result: await runOperation({ operation: setDiningServiceException, input }),
  });
}

export async function deleteExceptionAction({
  serviceId,
  date,
}: {
  serviceId: string;
  date: string;
}): Promise<ActionResult<{ serviceId: string; date: string }>> {
  return toActionResult({
    result: await runOperation({
      operation: deleteDiningServiceException,
      input: { serviceId, date },
    }),
  });
}

export type TableValues = {
  id: string;
  label: string | null;
  minCovers: number | null;
  maxCovers: number | null;
  onlineBookable: boolean;
};

export type SaveTablesActionInput = { layoutId: string; tables: readonly TableValues[] };

/**
 * Saves the table fields of a layout's seated pieces. Every piece of the layout goes back with
 * its id, because a save replaces the whole set (ADR 0119): the server rebuilds them from the
 * stored layout, so a piece this screen does not show is never lost.
 */
export async function saveTablesAction({
  layoutId,
  tables,
}: SaveTablesActionInput): Promise<ActionResult<LayoutDto>> {
  const read = await runOperation({ operation: getLayout, input: { id: layoutId } });
  if (!read.ok) return toActionResult({ result: read });
  const edits = new Map(tables.map((table) => [table.id, table]));
  const elements = read.value.elements.map((element) => {
    const piece = toInput({ element: toDraft({ element }) });
    const edit = edits.get(element.id);
    return edit
      ? {
          ...piece,
          label: edit.label,
          minCovers: edit.minCovers,
          maxCovers: edit.maxCovers,
          onlineBookable: edit.onlineBookable,
        }
      : piece;
  });
  const input = { id: layoutId, expectedVersion: read.value.version, elements };
  return toActionResult({ result: await runOperation({ operation: saveLayout, input }) });
}

export async function saveCombinationsAction({
  input,
}: {
  input: CombinationsSaveInput;
}): Promise<ActionResult<{ items: TableCombinationDto[] }>> {
  return toActionResult({
    result: await runOperation({ operation: saveTableCombinations, input }),
  });
}
