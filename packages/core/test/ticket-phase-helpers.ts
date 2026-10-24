import {
  type ExecuteContext,
  execute,
  listTicketPhases,
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

export type PhasesInput = { context: ExecuteContext };

/** Every active phase in order. */
export async function phases({ context }: PhasesInput) {
  return unwrap({ result: await execute({ operation: listTicketPhases, input: {}, context }) })
    .items;
}

export type ByNameInput = { context: ExecuteContext; name: string };

export async function phaseByName({ context, name }: ByNameInput) {
  const found = (await phases({ context })).find((phase) => phase.name === name);
  if (!found) throw new Error(`No phase ${name}`);
  return found;
}
