import {
  assignInquiry,
  createInquiry,
  getInquiry,
  type InquiryDto,
  InquirySchema,
  listInquiries,
  markInquiryLost,
  qualifyInquiry,
  updateInquiry,
} from "@okazi/core";
import { builder } from "../../schema/builder";
import { fieldFromOperation, mutationFromOperation } from "../../schema/from-operation";
import { objectFromSchema } from "../../schema/object-from-schema";
import { pageType } from "../../schema/page";
import { requirePermission } from "../../schema/require-permission";
import { runOperation } from "../../schema/run-operation";
import { CustomerRef } from "../customer/graphql";
import { EntityTypeRef } from "../entity-type/graphql";

export const InquiryRef = objectFromSchema<InquiryDto>({
  name: "Inquiry",
  schema: InquirySchema,
  omit: ["organizationId"],
  description:
    "Inquiry – the first step of the sales pipeline: type and fields, customer, contact, " +
    "desired dates, quantity, budget, the fixed status (NEW → QUALIFIED → QUOTED → WON or " +
    "LOST with a reason) and the salesperson.",
});
const InquiryPageRef = pageType({ name: "InquiryPage", item: InquiryRef });

fieldFromOperation({ operation: listInquiries, type: InquiryPageRef, name: "inquiries" });
fieldFromOperation({ operation: getInquiry, type: InquiryRef, name: "inquiry" });
for (const operation of [
  createInquiry,
  updateInquiry,
  qualifyInquiry,
  markInquiryLost,
  assignInquiry,
]) {
  mutationFromOperation({ operation, type: InquiryRef });
}

builder.objectField(InquiryRef, "entityType", (t) =>
  t.field({
    type: EntityTypeRef,
    description: "The inquiry type, with its fields.",
    resolve: (inquiry, _args, ctx) => {
      requirePermission({ ctx, permission: "configuration:read" });
      return ctx.loaders.entityType.load({ id: inquiry.entityTypeId }) as never;
    },
  }),
);

builder.objectField(InquiryRef, "customer", (t) =>
  t.field({
    type: CustomerRef,
    nullable: true,
    description: "The customer who asks (null if archived).",
    resolve: (inquiry, _args, ctx) => {
      requirePermission({ ctx, permission: "customer:read" });
      return ctx.loaders.customer.load({ id: inquiry.customerId });
    },
  }),
);

builder.objectField(CustomerRef, "inquiries", (t) =>
  t.field({
    type: [InquiryRef],
    description: "The customer's inquiries, newest first.",
    args: { limit: t.arg.int({ defaultValue: 50, description: "Max 100" }) },
    resolve: async (customer, { limit }, ctx) => {
      const page = (await runOperation({
        operation: listInquiries,
        input: { customerId: customer.id, limit: Math.min(Math.max(limit ?? 50, 1), 100) },
        ctx,
      })) as { items: InquiryDto[] };
      return page.items;
    },
  }),
);
