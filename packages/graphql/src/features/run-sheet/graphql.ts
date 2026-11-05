import {
  fulfillRunSheet,
  generateRunSheet,
  getRunSheet,
  listRunSheets,
  publishRunSheet,
  unfulfillRunSheet,
  type RunSheetDto,
  RunSheetSchema,
} from "@bibi/core";
import { builder } from "../../schema/builder";
import { fieldFromOperation, mutationFromOperation } from "../../schema/from-operation";
import { objectFromSchema } from "../../schema/object-from-schema";
import { pageType } from "../../schema/page";
import { runOperation } from "../../schema/run-operation";
import { OrderRef } from "../order/graphql";

export const RunSheetRef = objectFromSchema<RunSheetDto>({
  name: "RunSheet",
  schema: RunSheetSchema,
  omit: ["organizationId"],
  description:
    "Run sheet – one version of an order's compilation for a role (e.g. a kitchen order): the " +
    "snapshot `content`, and the `changes` marked ★ since the last published version.",
});
const RunSheetPageRef = pageType({ name: "RunSheetPage", item: RunSheetRef });

fieldFromOperation({ operation: listRunSheets, type: RunSheetPageRef, name: "runSheets" });
fieldFromOperation({ operation: getRunSheet, type: RunSheetRef, name: "runSheet" });
mutationFromOperation({ operation: generateRunSheet, type: RunSheetRef });
mutationFromOperation({ operation: publishRunSheet, type: RunSheetRef });
mutationFromOperation({ operation: fulfillRunSheet, type: RunSheetRef });
mutationFromOperation({ operation: unfulfillRunSheet, type: RunSheetRef });

// Graph edge; it lives here so that order/graphql.ts need not import this.
builder.objectField(OrderRef, "runSheets", (t) =>
  t.field({
    type: [RunSheetRef],
    description: "The order's run sheet versions, newest first.",
    args: { limit: t.arg.int({ defaultValue: 50, description: "Max 100" }) },
    resolve: async (order, { limit }, ctx) => {
      const input = { orderId: order.id, limit: Math.min(Math.max(limit ?? 50, 1), 100) };
      const page = (await runOperation({ operation: listRunSheets, input, ctx })) as {
        items: RunSheetDto[];
      };
      return page.items;
    },
  }),
);
