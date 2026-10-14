import {
  archiveItem,
  createItem,
  getEntityType,
  getItem,
  type ItemDto,
  ItemSchema,
  ItemSetupSchema,
  listItems,
  updateItem,
} from "@okazi/core";
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

export const ItemSetupRef = objectFromSchema<ItemSetupDto>({
  name: "ItemSetup",
  schema: ItemSetupSchema,
  description: "Capacity of an item in one setup.",
});

export const ItemRef = objectFromSchema<ItemDto>({
  name: "Item",
  schema: ItemSchema,
  omit: ["organizationId", "setups"],
  description: "Artikel – anything the organization sells or books, as defined by its item type.",
});
const ItemPageRef = pageType({ name: "ItemPage", item: ItemRef });

builder.objectField(ItemRef, "setups", (t) =>
  t.field({
    type: [ItemSetupRef],
    description: "Capacity per setup (SETUPS behaviour), largest first.",
    resolve: (item) => item.setups,
  }),
);

fieldFromOperation({ operation: listItems, type: ItemPageRef, name: "items" });
fieldFromOperation({ operation: getItem, type: ItemRef, name: "item" });
mutationFromOperation({ operation: createItem, type: ItemRef });
mutationFromOperation({ operation: updateItem, type: ItemRef });
mutationFromOperation({ operation: archiveItem, type: ItemRef });

// Graph edges. Reads go through core operations or the org-scoped `ctx.core.db`.
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
      return item.venueId ? ctx.core.db.venue.findFirst({ where: { id: item.venueId } }) : null;
    },
  }),
);

builder.objectField(ItemRef, "entityType", (t) =>
  t.field({
    type: EntityTypeRef,
    description: "The item type, with its fields.",
    resolve: (item, _args, ctx) =>
      runOperation({ operation: getEntityType, input: { id: item.entityTypeId }, ctx }) as never,
  }),
);

builder.objectField(ItemSetupRef, "setup", (t) =>
  t.field({
    type: SetupRef,
    nullable: true,
    description: "The setup (null if archived).",
    resolve: (itemSetup, _args, ctx) => {
      requirePermission({ ctx, permission: "configuration:read" });
      return ctx.core.db.setup.findFirst({ where: { id: itemSetup.setupId } });
    },
  }),
);
