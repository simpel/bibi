import {
  createOption,
  expireDueOptions,
  getOption,
  listOptions,
  type OptionDto,
  OptionSchema,
  releaseOption,
} from "@okazi/core";
import { builder } from "../../schema/builder";
import { fieldFromOperation, mutationFromOperation } from "../../schema/from-operation";
import { objectFromSchema } from "../../schema/object-from-schema";
import { pageType } from "../../schema/page";
import { runOperation } from "../../schema/run-operation";
import { ItemRef } from "../item/graphql";
import { TicketRef } from "../ticket/graphql";

export const OptionRef = objectFromSchema<OptionDto>({
  name: "Option",
  schema: OptionSchema,
  omit: ["organizationId"],
  description:
    "Option – a preliminary hold on a bookable item for [startsAt, endsAt) until expiresAt. " +
    "Options queue per item and time: rank 1 is the first option. Status ACTIVE → CONVERTED, " +
    "EXPIRED or RELEASED.",
});
const OptionPageRef = pageType({ name: "OptionPage", item: OptionRef });
const OptionExpireDueRef = builder.objectRef<{ items: OptionDto[] }>("OptionExpireDueResult");
OptionExpireDueRef.implement({
  description: "The options `option.expireDue` expired.",
  fields: (t) => ({ items: t.field({ type: [OptionRef], resolve: (result) => result.items }) }),
});

fieldFromOperation({ operation: listOptions, type: OptionPageRef, name: "options" });
fieldFromOperation({ operation: getOption, type: OptionRef, name: "option" });
mutationFromOperation({ operation: createOption, type: OptionRef });
mutationFromOperation({ operation: releaseOption, type: OptionRef });
mutationFromOperation({ operation: expireDueOptions, type: OptionExpireDueRef });

// Graph edges. They live here so that item/ and ticket/graphql.ts do not need to import this file.
builder.objectField(ItemRef, "options", (t) =>
  t.field({
    type: [OptionRef],
    description: "Options queued on the item (all statuses), by start and rank.",
    args: { limit: t.arg.int({ defaultValue: 50, description: "Max 100" }) },
    resolve: async (item, { limit }, ctx) => {
      const page = (await runOperation({
        operation: listOptions,
        input: { itemId: item.id, limit: Math.min(Math.max(limit ?? 50, 1), 100) },
        ctx,
      })) as { items: OptionDto[] };
      return page.items;
    },
  }),
);

builder.objectField(TicketRef, "options", (t) =>
  t.field({
    type: [OptionRef],
    description: "Options placed for the ticket (all statuses), by item, start and rank.",
    args: { limit: t.arg.int({ defaultValue: 50, description: "Max 100" }) },
    resolve: async (ticket, { limit }, ctx) => {
      const page = (await runOperation({
        operation: listOptions,
        input: { ticketId: ticket.id, limit: Math.min(Math.max(limit ?? 50, 1), 100) },
        ctx,
      })) as { items: OptionDto[] };
      return page.items;
    },
  }),
);
