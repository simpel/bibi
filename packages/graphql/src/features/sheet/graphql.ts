import {
  generateSheet,
  getSheet,
  listSheets,
  type SheetDto,
  SheetSchema,
  sendSheet,
} from "@bibi/core";
import { builder } from "../../schema/builder";
import { fieldFromOperation, mutationFromOperation } from "../../schema/from-operation";
import { objectFromSchema } from "../../schema/object-from-schema";
import { pageType } from "../../schema/page";
import { runOperation } from "../../schema/run-operation";
import { TicketRef } from "../ticket/graphql";

export const SheetRef = objectFromSchema<SheetDto>({
  name: "Sheet",
  schema: SheetSchema,
  omit: ["organizationId"],
  description:
    "Sheet – one version of a ticket's compilation for a role (e.g. a kitchen order): the " +
    "snapshot `content`, and the `changes` marked ★ since the last sent version.",
});
const SheetPageRef = pageType({ name: "SheetPage", item: SheetRef });

fieldFromOperation({ operation: listSheets, type: SheetPageRef, name: "sheets" });
fieldFromOperation({ operation: getSheet, type: SheetRef, name: "sheet" });
mutationFromOperation({ operation: generateSheet, type: SheetRef });
mutationFromOperation({ operation: sendSheet, type: SheetRef });

// Graph edge; it lives here so that ticket/graphql.ts need not import this.
builder.objectField(TicketRef, "sheets", (t) =>
  t.field({
    type: [SheetRef],
    description: "The ticket's sheet versions, newest first.",
    args: { limit: t.arg.int({ defaultValue: 50, description: "Max 100" }) },
    resolve: async (ticket, { limit }, ctx) => {
      const input = { ticketId: ticket.id, limit: Math.min(Math.max(limit ?? 50, 1), 100) };
      const page = (await runOperation({ operation: listSheets, input, ctx })) as {
        items: SheetDto[];
      };
      return page.items;
    },
  }),
);
