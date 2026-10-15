import {
  type ExecuteContext,
  execute,
  listBookingStatuses,
  provisionOrganization,
} from "../src/index";
import { testContext, unwrap } from "./helpers";

/** A fresh organization provisioned like a real signup: one status per phase. */
export async function provisionedContext(): Promise<ExecuteContext> {
  const context = testContext();
  unwrap({ result: await provisionOrganization({ organizationId: context.organizationId }) });
  return context;
}

export type StatusesInput = { context: ExecuteContext };

/** Every active status in order. */
export async function statuses({ context }: StatusesInput) {
  return unwrap({ result: await execute({ operation: listBookingStatuses, input: {}, context }) })
    .items;
}

export type ByNameInput = { context: ExecuteContext; name: string };

export async function statusByName({ context, name }: ByNameInput) {
  const found = (await statuses({ context })).find((status) => status.name === name);
  if (!found) throw new Error(`No status ${name}`);
  return found;
}
