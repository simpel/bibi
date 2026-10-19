import { createResponsibility, type ExecuteContext, execute } from "../src/index";
import { unwrap } from "./helpers";
import { addTestMemberWithUser } from "./org-helpers";

export type CreateTestResponsibilityInput = { context: ExecuteContext; name?: string };

/** A responsibility (ADR 0034) with a new member as its default assignee, covering no types. */
export async function createTestResponsibility({
  context,
  name = "Head of kitchen",
}: CreateTestResponsibilityInput) {
  const chef = await addTestMemberWithUser({ context, role: "member", name: "Chef" });
  const input = { name, defaultAssigneeId: chef.userId };
  return unwrap({ result: await execute({ operation: createResponsibility, input, context }) });
}
