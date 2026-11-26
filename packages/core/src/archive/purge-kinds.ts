import { customerKind } from "../features/customer/deletion-kind";
import { deleteCustomer, restoreCustomer } from "../features/customer/deletion-operations";
import { entityTypeKind } from "../features/entity-type/deletion-kind";
import { deleteEntityType, restoreEntityType } from "../features/entity-type/deletion-operations";
import { itemKind } from "../features/item/deletion-kind";
import { deleteItem, restoreItem } from "../features/item/deletion-operations";
import { itemTypeGroupKind } from "../features/item-type-group/deletion-kind";
import {
  deleteItemTypeGroup,
  restoreItemTypeGroup,
} from "../features/item-type-group/deletion-operations";
import { orderKind } from "../features/order/deletion-kind";
import { deleteOrder, restoreOrder } from "../features/order/deletion-operations";
import { orderStatusKind } from "../features/order-status/deletion-kind";
import {
  deleteOrderStatus,
  restoreOrderStatus,
} from "../features/order-status/deletion-operations";
import { orderTemplateKind } from "../features/order-template/deletion-kind";
import {
  deleteOrderTemplate,
  restoreOrderTemplate,
} from "../features/order-template/deletion-operations";
import { priceListKind } from "../features/price-list/deletion-kind";
import { deletePriceList, restorePriceList } from "../features/price-list/deletion-operations";
import { responsibilityKind } from "../features/responsibility/deletion-kind";
import {
  deleteResponsibility,
  restoreResponsibility,
} from "../features/responsibility/deletion-operations";
import { runSheetDefinitionKind } from "../features/run-sheet-definition/deletion-kind";
import {
  deleteRunSheetDefinition,
  restoreRunSheetDefinition,
} from "../features/run-sheet-definition/deletion-operations";
import { skillKind } from "../features/skill/deletion-kind";
import { deleteSkill, restoreSkill } from "../features/skill/deletion-operations";
import { taskKind } from "../features/task/deletion-kind";
import { deleteTask, restoreTask } from "../features/task/deletion-operations";
import { venueKind } from "../features/venue/deletion-kind";
import { deleteVenue, restoreVenue } from "../features/venue/deletion-operations";
import { vocabularyKind } from "../features/vocabulary/deletion-kind";
import { deleteVocabulary, restoreVocabulary } from "../features/vocabulary/deletion-operations";
import type { AnyOperation } from "../operations/types";
import type { LifecycleKind } from "./lifecycle-kind";

/** A kind with its `<entity>.delete` (`operation`) and `<entity>.restore`. */
export type PurgeKind = { kind: LifecycleKind; operation: AnyOperation; restore: AnyOperation };

/**
 * Every kind the retention job deletes (ADR 0118), referrers before what they refer to, so one
 * night clears a chain: tasks and orders before customers and items, items before venues and
 * types, types before lists. A record still refused is tried again the next night.
 */
export const PURGE_KINDS: readonly PurgeKind[] = [
  { kind: taskKind, operation: deleteTask, restore: restoreTask },
  { kind: orderKind, operation: deleteOrder, restore: restoreOrder },
  { kind: orderTemplateKind, operation: deleteOrderTemplate, restore: restoreOrderTemplate },
  { kind: priceListKind, operation: deletePriceList, restore: restorePriceList },
  { kind: itemKind, operation: deleteItem, restore: restoreItem },
  { kind: customerKind, operation: deleteCustomer, restore: restoreCustomer },
  { kind: venueKind, operation: deleteVenue, restore: restoreVenue },
  {
    kind: runSheetDefinitionKind,
    operation: deleteRunSheetDefinition,
    restore: restoreRunSheetDefinition,
  },
  { kind: responsibilityKind, operation: deleteResponsibility, restore: restoreResponsibility },
  { kind: orderStatusKind, operation: deleteOrderStatus, restore: restoreOrderStatus },
  { kind: entityTypeKind, operation: deleteEntityType, restore: restoreEntityType },
  { kind: vocabularyKind, operation: deleteVocabulary, restore: restoreVocabulary },
  { kind: itemTypeGroupKind, operation: deleteItemTypeGroup, restore: restoreItemTypeGroup },
  { kind: skillKind, operation: deleteSkill, restore: restoreSkill },
];
