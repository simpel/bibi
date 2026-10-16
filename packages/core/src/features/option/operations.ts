import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { notFound } from "../../shared/errors";
import { pageArgs } from "../../shared/page-input";
import { paginate } from "../../shared/paginate";
import { expireDueOptions } from "./expire-due";
import {
  OptionIdInputSchema,
  OptionListInputSchema,
  OptionListOutputSchema,
  OptionSchema,
} from "./schema";
import { loadOption, toOptionDto } from "./to-option-dto";
import { createOption, releaseOption } from "./write-operations";

export const listOptions = defineOperation({
  name: "option.list",
  kind: "query",
  description:
    "List options (preliminary holds) in queue order: by item, then start, then rank " +
    "(1 = first option). Filter by item, inquiry, status (ACTIVE, CONVERTED, EXPIRED, RELEASED) " +
    "and a time window (from/to).",
  input: OptionListInputSchema,
  output: OptionListOutputSchema,
  permission: "option:read",
  handler: async ({ input, context }) => {
    const { itemId, inquiryId, optionStatus, from, to } = input;
    const rows = await context.db.option.findMany({
      where: {
        ...(itemId ? { itemId } : {}),
        ...(inquiryId ? { inquiryId } : {}),
        ...(optionStatus ? { optionStatus } : {}),
        ...(from ? { endsAt: { gt: from } } : {}),
        ...(to ? { startsAt: { lt: to } } : {}),
      },
      orderBy: [
        { itemId: "asc" },
        { startsAt: "asc" },
        { rank: { sort: "asc", nulls: "last" } },
        { sequence: "asc" },
      ],
      ...pageArgs(input),
    });
    const page = paginate({ rows, limit: input.limit });
    const items = page.items.map((row) => toOptionDto({ row }));
    return ok({ value: { items, nextCursor: page.nextCursor } });
  },
});

export const getOption = defineOperation({
  name: "option.get",
  kind: "query",
  description:
    "Get one option by id: bookable item, period, expiry date, rank in the queue, status and " +
    "the inquiry it was placed for.",
  input: OptionIdInputSchema,
  output: OptionSchema,
  permission: "option:read",
  handler: async ({ input, context }) => {
    const option = await loadOption({ context, id: input.id });
    return option ? ok({ value: option }) : notFound({ entity: "Option" });
  },
});

export const optionOperations = [
  listOptions,
  getOption,
  createOption,
  releaseOption,
  expireDueOptions,
];
