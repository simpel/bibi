import {
  type ExecuteContext,
  execute,
  listTicketStatuses,
  provisionOrganization,
} from "../src/index";
import { FALLBACK_TIME_ZONE } from "../src/time/time-zone";
import { testContext, unwrap } from "./helpers";

/** A fresh organization provisioned like a real signup: Lead, Confirmed, Completed, Lost. */
export async function provisionedContext(): Promise<ExecuteContext> {
  const context = testContext();
  unwrap({
    result: await provisionOrganization({
      organizationId: context.organizationId,
      timeZone: FALLBACK_TIME_ZONE,
    }),
  });
  return context;
}

export type StatusesInput = { context: ExecuteContext };

/** Every active status in order. */
export async function statuses({ context }: StatusesInput) {
  return unwrap({ result: await execute({ operation: listTicketStatuses, input: {}, context }) })
    .items;
}

export type ByNameInput = { context: ExecuteContext; name: string };

export async function statusByName({ context, name }: ByNameInput) {
  const found = (await statuses({ context })).find((ticketStatus) => ticketStatus.name === name);
  if (!found) throw new Error(`No status ${name}`);
  return found;
}
