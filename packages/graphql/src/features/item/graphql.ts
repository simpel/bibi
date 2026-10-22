import {
  archiveItem,
  createItem,
  getItem,
  ItemCustomisationGroupSchema,
  type ItemDto,
  ItemPartSchema,
  ItemSchema,
  ItemSetupSchema,
  listItems,
  saveItemAsBundle,
  updateItem,
} from "@bibi/core";
import { builder } from "../../schema/builder";
import { fieldFromOperation, mutationFromOperation } from "../../schema/from-operation";
import { objectFromSchema } from "../../schema/object-from-schema";
import { pageType } from "../../schema/page";
import { requirePermission } from "../../schema/require-permission";
import { runOperation } from "../../schema/run-operation";
import { EntityTypeRef } from "../entity-type/graphql";
import { SetupRef } from "../setup/graphql";
import { VenueRef } from "../venue/graphql";

type ItemSetupDto = ItemDto["setups"][number];
type ItemPartDto = ItemDto["parts"][number];
type ItemCustomisationGroupDto = ItemDto["customisationGroups"][number];

export const ItemSetupRef = objectFromSchema<ItemSetupDto>({
  name: "ItemSetup",
  schema: ItemSetupSchema,
  description: "Capacity of an item in one setup.",
});

export const ItemPartRef = objectFromSchema<ItemPartDto>({
  name: "ItemPart",
  schema: ItemPartSchema,
  description: "One part of a BUNDLE item: quantity, timing and whether it is mandatory.",
});

export const ItemCustomisationGroupRef = objectFromSchema<ItemCustomisationGroupDto>({
  name: "ItemCustomisationGroup",
  schema: ItemCustomisationGroupSchema,
  description:
    "Customisation group of a CUSTOMISATIONS item: pick between minPick and maxPick of the options.",
});

export const ItemRef = objectFromSchema<ItemDto>({
  name: "Item",
  schema: ItemSchema,
  omit: ["organizationId", "setups", "parts", "customisationGroups"],
  description: "Artikel – anything the organization sells or books, as defined by its item type.",
});
const ItemPageRef = pageType({ name: "ItemPage", item: ItemRef });

builder.objectField(ItemRef, "setups", (t) =>
  t.field({
    type: [ItemSetupRef],
    description: "Capacity per setup (SETUPS capability), largest first.",
    resolve: (item) => item.setups,
  }),
);

builder.objectField(ItemRef, "parts", (t) =>
  t.field({
    type: [ItemPartRef],
    description: "Parts (BUNDLE capability), by offset.",
    resolve: (item) => item.parts,
  }),
);

builder.objectField(ItemRef, "customisationGroups", (t) =>
  t.field({
    type: [ItemCustomisationGroupRef],
    description: "Customisation groups among the parts (CUSTOMISATIONS capability), in order.",
    resolve: (item) => item.customisationGroups,
  }),
);

builder.objectField(ItemPartRef, "item", (t) =>
  t.field({
    type: ItemRef,
    nullable: true,
    description: "The part (null if archived).",
    resolve: (part, _args, ctx) =>
      runOperation({ operation: getItem, input: { id: part.itemId }, ctx }).catch(
        () => null,
      ) as never,
  }),
);

fieldFromOperation({ operation: listItems, type: ItemPageRef, name: "items" });
fieldFromOperation({ operation: getItem, type: ItemRef, name: "item" });
mutationFromOperation({ operation: createItem, type: ItemRef });
mutationFromOperation({ operation: updateItem, type: ItemRef });
mutationFromOperation({ operation: archiveItem, type: ItemRef });
mutationFromOperation({ operation: saveItemAsBundle, type: ItemRef });

// Graph edges. Reads go through core operations or the per-request loaders (org-scoped).
// They live here so that venue/graphql.ts does not need to import this file.
builder.objectField(VenueRef, "items", (t) =>
  t.field({
    type: [ItemRef],
    description: "Active items of the venue, ordered by name.",
    args: { limit: t.arg.int({ defaultValue: 50, description: "Max 100" }) },
    resolve: async (venue, { limit }, ctx) => {
      const page = (await runOperation({
        operation: listItems,
        input: { venueId: venue.id, limit: Math.min(Math.max(limit ?? 50, 1), 100) },
        ctx,
      })) as { items: ItemDto[] };
      return page.items;
    },
  }),
);

builder.objectField(ItemRef, "venue", (t) =>
  t.field({
    type: VenueRef,
    nullable: true,
    description: "The venue the item belongs to (null if none or archived).",
    resolve: (item, _args, ctx) => {
      requirePermission({ ctx, permission: "venue:read" });
      return item.venueId ? ctx.loaders.venue.load({ id: item.venueId }) : null;
    },
  }),
);

builder.objectField(ItemRef, "entityType", (t) =>
  t.field({
    type: EntityTypeRef,
    description: "The item type, with its fields.",
    resolve: (item, _args, ctx) => {
      requirePermission({ ctx, permission: "configuration:read" });
      return ctx.loaders.entityType.load({ id: item.entityTypeId }) as never;
    },
  }),
);

builder.objectField(ItemSetupRef, "setup", (t) =>
  t.field({
    type: SetupRef,
    nullable: true,
    description: "The setup (null if archived).",
    resolve: (itemSetup, _args, ctx) => {
      requirePermission({ ctx, permission: "configuration:read" });
      return ctx.loaders.setup.load({ id: itemSetup.setupId });
    },
  }),
);
