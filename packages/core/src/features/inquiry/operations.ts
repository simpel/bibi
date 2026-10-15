import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { notFound } from "../../shared/errors";
import { pageArgs } from "../../shared/page-input";
import { paginate } from "../../shared/paginate";
import { assignInquiry } from "./assign-operation";
import { markInquiryLost, qualifyInquiry } from "./lifecycle-operations";
import {
  InquiryIdInputSchema,
  InquiryListInputSchema,
  InquiryListOutputSchema,
  InquirySchema,
} from "./schema";
import { loadInquiry, toInquiryDto } from "./to-inquiry-dto";
import { createInquiry, updateInquiry } from "./write-operations";

export const listInquiries = defineOperation({
  name: "inquiry.list",
  kind: "query",
  description:
    "List the organization's inquiries, newest first. Filter by customer, type, status " +
    "(NEW, QUALIFIED, QUOTED, WON, LOST) or salesperson.",
  input: InquiryListInputSchema,
  output: InquiryListOutputSchema,
  permission: "inquiry:read",
  handler: async ({ input, context }) => {
    const { customerId, entityTypeId, inquiryStatus, salesOwnerId } = input;
    const rows = await context.db.inquiry.findMany({
      where: {
        ...(customerId ? { customerId } : {}),
        ...(entityTypeId ? { entityTypeId } : {}),
        ...(inquiryStatus ? { inquiryStatus } : {}),
        ...(salesOwnerId ? { salesOwnerId } : {}),
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      ...pageArgs(input),
    });
    const page = paginate({ rows, limit: input.limit });
    const items = page.items.map((row) => toInquiryDto({ row }));
    return ok({ value: { items, nextCursor: page.nextCursor } });
  },
});

export const getInquiry = defineOperation({
  name: "inquiry.get",
  kind: "query",
  description:
    "Get one inquiry by id: type and its field values, customer, contact, desired dates, " +
    "quantity, budget, status (with loss reason) and salesperson.",
  input: InquiryIdInputSchema,
  output: InquirySchema,
  permission: "inquiry:read",
  handler: async ({ input, context }) => {
    const inquiry = await loadInquiry({ context, id: input.id });
    return inquiry ? ok({ value: inquiry }) : notFound({ entity: "Inquiry" });
  },
});

export const inquiryOperations = [
  listInquiries,
  getInquiry,
  createInquiry,
  updateInquiry,
  qualifyInquiry,
  markInquiryLost,
  assignInquiry,
];
