import {
  archiveOccupancy,
  createOccupancy,
  getOccupancy,
  listOccupancies,
  type OccupancyDto,
  OccupancySchema,
  updateOccupancy,
} from "@bibi/core";
import { builder } from "../../schema/builder";
import { fieldFromOperation, mutationFromOperation } from "../../schema/from-operation";
import { objectFromSchema } from "../../schema/object-from-schema";
import { pageType } from "../../schema/page";
import { runOperation } from "../../schema/run-operation";
import { ItemRef } from "../item/graphql";

export const OccupancyRef = objectFromSchema<OccupancyDto>({
  name: "Occupancy",
  schema: OccupancySchema,
  omit: ["organizationId"],
  description:
    "Occupancy – a bookable item is taken for [startsAt, endsAt): ticket, option, setup time, " +
    "maintenance or internal use. Only options may overlap.",
});
const OccupancyPageRef = pageType({ name: "OccupancyPage", item: OccupancyRef });

fieldFromOperation({ operation: listOccupancies, type: OccupancyPageRef, name: "occupancies" });
fieldFromOperation({ operation: getOccupancy, type: OccupancyRef, name: "occupancy" });
mutationFromOperation({ operation: createOccupancy, type: OccupancyRef });
mutationFromOperation({ operation: updateOccupancy, type: OccupancyRef });
mutationFromOperation({ operation: archiveOccupancy, type: OccupancyRef });

// Graph edge. It lives here so that item/graphql.ts does not need to import this file.
builder.objectField(ItemRef, "occupancies", (t) =>
  t.field({
    type: [OccupancyRef],
    description: "Active occupancies of the item that end after `from`, earliest first.",
    args: {
      from: t.arg({ type: "DateTime", required: false, description: "Default: no lower bound" }),
      limit: t.arg.int({ defaultValue: 50, description: "Max 100" }),
    },
    resolve: async (item, { from, limit }, ctx) => {
      const page = (await runOperation({
        operation: listOccupancies,
        input: {
          itemId: item.id,
          ...(from ? { from } : {}),
          limit: Math.min(Math.max(limit ?? 50, 1), 100),
        },
        ctx,
      })) as { items: OccupancyDto[] };
      return page.items;
    },
  }),
);
