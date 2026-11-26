"use server";

import {
  archiveOrderOperation,
  deleteCustomer,
  deleteEntityType,
  deleteItem,
  deleteItemTypeGroup,
  deleteOrder,
  deleteOrderStatus,
  deleteOrderTemplate,
  deletePriceList,
  deleteResponsibility,
  deleteRunSheetDefinition,
  deleteSkill,
  deleteTask,
  deleteVenue,
  deleteVocabulary,
  type Result,
  restoreCustomer,
  restoreEntityType,
  restoreItem,
  restoreItemTypeGroup,
  restoreOrder,
  restoreOrderStatus,
  restoreOrderTemplate,
  restorePriceList,
  restoreResponsibility,
  restoreRunSheetDefinition,
  restoreSkill,
  restoreTask,
  restoreVenue,
  restoreVocabulary,
} from "@bibi/core";
import type { ActionResult } from "@/lib/action-result";
import { runOperation } from "@/server/run-operation";
import { toActionResult } from "@/server/to-action-result";
import type { LifecycleKind } from "./lifecycle-kinds";

type Run = (id: string) => Promise<Result<unknown>>;

/** `<entity>.restore` per kind of record with its own page (ADR 0118). */
const RESTORE: Record<LifecycleKind, Run> = {
  task: (id) => runOperation({ operation: restoreTask, input: { id } }),
  customer: (id) => runOperation({ operation: restoreCustomer, input: { id } }),
  item: (id) => runOperation({ operation: restoreItem, input: { id } }),
  venue: (id) => runOperation({ operation: restoreVenue, input: { id } }),
  order: (id) => runOperation({ operation: restoreOrder, input: { id } }),
  orderTemplate: (id) => runOperation({ operation: restoreOrderTemplate, input: { id } }),
  priceList: (id) => runOperation({ operation: restorePriceList, input: { id } }),
  entityType: (id) => runOperation({ operation: restoreEntityType, input: { id } }),
  vocabulary: (id) => runOperation({ operation: restoreVocabulary, input: { id } }),
  responsibility: (id) => runOperation({ operation: restoreResponsibility, input: { id } }),
  runSheetDefinition: (id) => runOperation({ operation: restoreRunSheetDefinition, input: { id } }),
  skill: (id) => runOperation({ operation: restoreSkill, input: { id } }),
  orderStatus: (id) => runOperation({ operation: restoreOrderStatus, input: { id } }),
  itemTypeGroup: (id) => runOperation({ operation: restoreItemTypeGroup, input: { id } }),
};

/** `<entity>.delete` per kind: only an archived record is deleted. */
const DELETE: Record<LifecycleKind, Run> = {
  task: (id) => runOperation({ operation: deleteTask, input: { id } }),
  customer: (id) => runOperation({ operation: deleteCustomer, input: { id } }),
  item: (id) => runOperation({ operation: deleteItem, input: { id } }),
  venue: (id) => runOperation({ operation: deleteVenue, input: { id } }),
  order: (id) => runOperation({ operation: deleteOrder, input: { id } }),
  orderTemplate: (id) => runOperation({ operation: deleteOrderTemplate, input: { id } }),
  priceList: (id) => runOperation({ operation: deletePriceList, input: { id } }),
  entityType: (id) => runOperation({ operation: deleteEntityType, input: { id } }),
  vocabulary: (id) => runOperation({ operation: deleteVocabulary, input: { id } }),
  responsibility: (id) => runOperation({ operation: deleteResponsibility, input: { id } }),
  runSheetDefinition: (id) => runOperation({ operation: deleteRunSheetDefinition, input: { id } }),
  skill: (id) => runOperation({ operation: deleteSkill, input: { id } }),
  orderStatus: (id) => runOperation({ operation: deleteOrderStatus, input: { id } }),
  itemTypeGroup: (id) => runOperation({ operation: deleteItemTypeGroup, input: { id } }),
};

export type LifecycleActionInput = { kind: LifecycleKind; id: string };

export async function restoreRecordAction({
  kind,
  id,
}: LifecycleActionInput): Promise<ActionResult<unknown>> {
  return toActionResult({ result: await RESTORE[kind](id) });
}

export async function deleteRecordAction({
  kind,
  id,
}: LifecycleActionInput): Promise<ActionResult<unknown>> {
  return toActionResult({ result: await DELETE[kind](id) });
}

export type ArchiveOrderActionInput = { id: string };

export async function archiveOrderAction({
  id,
}: ArchiveOrderActionInput): Promise<ActionResult<unknown>> {
  return toActionResult({
    result: await runOperation({ operation: archiveOrderOperation, input: { id } }),
  });
}
