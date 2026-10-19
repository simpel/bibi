import { archiveItemState } from "./archive-operation";
import { previewArchiveItemState } from "./archive-preview-operation";
import { reorderItemStates, setItemStateTransitions } from "./order-operations";
import { getItemState, listItemStates } from "./read-operations";
import { createItemState, updateItemState } from "./write-operations";

/** Every item state operation (ADR 0044); implementations live in the sibling files. */
export const itemStateOperations = [
  listItemStates,
  getItemState,
  createItemState,
  updateItemState,
  archiveItemState,
  previewArchiveItemState,
  reorderItemStates,
  setItemStateTransitions,
];
