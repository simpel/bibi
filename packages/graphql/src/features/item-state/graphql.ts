import {
  archiveItemState,
  createItemState,
  getItemState,
  type ItemStateDto,
  ItemStateSchema,
  listItemStates,
  previewArchiveItemState,
  reorderItemStates,
  setItemStateTransitions,
  updateItemState,
} from "@okazi/core";
import { ArchivePreviewRef } from "../../schema/archive-preview";
import { builder } from "../../schema/builder";
import { fieldFromOperation, mutationFromOperation } from "../../schema/from-operation";
import { objectFromSchema } from "../../schema/object-from-schema";
import { pageType } from "../../schema/page";
import { requirePermission } from "../../schema/require-permission";
import { ProgramItemRef } from "../program-item/graphql";

export const ItemStateRef = objectFromSchema<ItemStateDto>({
  name: "ItemState",
  schema: ItemStateSchema,
  omit: ["organizationId"],
  description:
    "Item state – one of the organization's own states for lines of an item type, with its " +
    "flags (initial, hold NONE/SOFT/HARD, inSheets, released, expires). `transitionsTo` lists " +
    "the states a line may move to.",
});
const ItemStatePageRef = pageType({ name: "ItemStatePage", item: ItemStateRef });

fieldFromOperation({ operation: listItemStates, type: ItemStatePageRef, name: "itemStates" });
fieldFromOperation({ operation: getItemState, type: ItemStateRef, name: "itemState" });
mutationFromOperation({ operation: createItemState, type: ItemStateRef });
mutationFromOperation({ operation: updateItemState, type: ItemStateRef });
mutationFromOperation({ operation: archiveItemState, type: ItemStateRef });
fieldFromOperation({
  operation: previewArchiveItemState,
  type: ArchivePreviewRef,
  name: "itemStateArchivePreview",
});
mutationFromOperation({ operation: reorderItemStates, type: ItemStatePageRef });
mutationFromOperation({ operation: setItemStateTransitions, type: ItemStateRef });

// Graph edge. It lives here so that program-item/graphql.ts does not need to import this file.
builder.objectField(ProgramItemRef, "state", (t) =>
  t.field({
    type: ItemStateRef,
    nullable: true,
    description: "The line's state (null for a line without an item).",
    resolve: (programItem, _args, ctx) => {
      if (!programItem.stateId) return null;
      requirePermission({ ctx, permission: "pipeline:view" });
      return ctx.loaders.itemState.load({ id: programItem.stateId });
    },
  }),
);
