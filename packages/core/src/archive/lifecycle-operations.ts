import { listArchived } from "../features/archive/operations";
import { deleteCustomer, restoreCustomer } from "../features/customer/deletion-operations";
import { deleteEntityType, restoreEntityType } from "../features/entity-type/deletion-operations";
import { deleteItem, restoreItem } from "../features/item/deletion-operations";
import {
  deleteItemTypeGroup,
  restoreItemTypeGroup,
} from "../features/item-type-group/deletion-operations";
import {
  archiveOrderOperation,
  deleteOrder,
  restoreOrder,
} from "../features/order/deletion-operations";
import {
  deleteOrderStatus,
  restoreOrderStatus,
} from "../features/order-status/deletion-operations";
import {
  deleteOrderTemplate,
  restoreOrderTemplate,
} from "../features/order-template/deletion-operations";
import { deletePriceList, restorePriceList } from "../features/price-list/deletion-operations";
import {
  deleteResponsibility,
  restoreResponsibility,
} from "../features/responsibility/deletion-operations";
import {
  deleteRunSheetDefinition,
  restoreRunSheetDefinition,
} from "../features/run-sheet-definition/deletion-operations";
import { deleteSkill, restoreSkill } from "../features/skill/deletion-operations";
import { deleteTask, restoreTask } from "../features/task/deletion-operations";
import { deleteVenue, restoreVenue } from "../features/venue/deletion-operations";
import { deleteVocabulary, restoreVocabulary } from "../features/vocabulary/deletion-operations";

/**
 * Restore and delete of every record with its own page (ADR 0118), plus `order.archive`. They
 * live beside each feature's other operations but are listed here: each builds on its feature's
 * `get`, which the feature's own list would otherwise import in a cycle. `archive.list` is the
 * Archive page that lists what they act on.
 */
export const lifecycleOperations = [
  restoreTask,
  deleteTask,
  restoreCustomer,
  deleteCustomer,
  restoreItem,
  deleteItem,
  restoreVenue,
  deleteVenue,
  restoreOrderTemplate,
  deleteOrderTemplate,
  restorePriceList,
  deletePriceList,
  restoreEntityType,
  deleteEntityType,
  restoreVocabulary,
  deleteVocabulary,
  restoreResponsibility,
  deleteResponsibility,
  restoreRunSheetDefinition,
  deleteRunSheetDefinition,
  restoreSkill,
  deleteSkill,
  restoreOrderStatus,
  deleteOrderStatus,
  restoreItemTypeGroup,
  deleteItemTypeGroup,
  archiveOrderOperation,
  restoreOrder,
  deleteOrder,
  listArchived,
];
