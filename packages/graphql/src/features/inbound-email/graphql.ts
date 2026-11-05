import {
  getInboundEmail,
  type InboundEmailDto,
  InboundEmailSchema,
  listInboundEmails,
} from "@bibi/core";
import { builder } from "../../schema/builder";
import { fieldFromOperation } from "../../schema/from-operation";
import { objectFromSchema } from "../../schema/object-from-schema";
import { type Page, pageType } from "../../schema/page";
import { runOperation } from "../../schema/run-operation";
import { OrderRef } from "../order/graphql";

export const InboundEmailRef = objectFromSchema<InboundEmailDto>({
  name: "InboundEmail",
  schema: InboundEmailSchema,
  omit: ["organizationId"],
  description:
    "A mail received on an order's own inbound address (a customer reply): sender, subject, " +
    "text and HTML body and attachment metadata.",
});
const InboundEmailPageRef = pageType({ name: "InboundEmailPage", item: InboundEmailRef });

fieldFromOperation({
  operation: listInboundEmails,
  type: InboundEmailPageRef,
  name: "inboundEmails",
});
fieldFromOperation({ operation: getInboundEmail, type: InboundEmailRef, name: "inboundEmail" });

// Graph edge. Goes through `inboundEmail.list`, so its permission applies here too.
builder.objectField(OrderRef, "inboundEmails", (t) =>
  t.field({
    type: [InboundEmailRef],
    description: "Mails received on the order's inbound address, newest first.",
    args: { limit: t.arg.int({ defaultValue: 50, description: "Max 100" }) },
    resolve: async (order, { limit }, ctx) => {
      const input = { orderId: order.id, limit: Math.min(Math.max(limit ?? 50, 1), 100) };
      const page = (await runOperation({
        operation: listInboundEmails,
        input,
        ctx,
      })) as Page<InboundEmailDto>;
      return page.items;
    },
  }),
);
