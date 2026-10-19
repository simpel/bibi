import {
  createDeposit,
  type DepositDto,
  DepositSchema,
  getDeposit,
  listDeposits,
  sendDeposit,
  voidDeposit,
} from "@okazi/core";
import { builder } from "../../schema/builder";
import { fieldFromOperation, mutationFromOperation } from "../../schema/from-operation";
import { objectFromSchema } from "../../schema/object-from-schema";
import { type Page, pageType } from "../../schema/page";
import { runOperation } from "../../schema/run-operation";
import { TicketRef } from "../ticket/graphql";

export const DepositRef = objectFromSchema<DepositDto>({
  name: "Deposit",
  schema: DepositSchema,
  omit: ["organizationId"],
  description:
    "A deposit request (ADR 0057): a frozen receivable with a fixed amount and description. " +
    "Lifecycle DRAFT → SENT → VOID; what is paid against it is derived from its payments.",
});
const DepositPageRef = pageType({ name: "DepositPage", item: DepositRef });

fieldFromOperation({ operation: listDeposits, type: DepositPageRef, name: "deposits" });
fieldFromOperation({ operation: getDeposit, type: DepositRef, name: "deposit" });
for (const operation of [createDeposit, sendDeposit, voidDeposit]) {
  mutationFromOperation({ operation, type: DepositRef });
}

// Graph edge. Goes through `deposit.list`, so its permission applies here too.
builder.objectField(TicketRef, "deposits", (t) =>
  t.field({
    type: [DepositRef],
    description: "Deposit requests on the ticket, newest first.",
    resolve: async (ticket, _args, ctx) => {
      const input = { ticketId: ticket.id, limit: 100 };
      const page = (await runOperation({
        operation: listDeposits,
        input,
        ctx,
      })) as Page<DepositDto>;
      return page.items;
    },
  }),
);
