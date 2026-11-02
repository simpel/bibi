import { describe, expect, it } from "vitest";
import { createWorkOrderDefinition, execute } from "../src/index";
import { errorCode } from "./helpers";
import { testOrg } from "./org-helpers";
import { createWorkOrderSetup, kitchenOrder } from "./work-order-definition-helpers";

describe("work order definitions across organizations (ADR 0021, 0056)", () => {
  it("never refers to another organization's configuration", async () => {
    const theirs = await createWorkOrderSetup({ context: await testOrg() });
    const context = await testOrg();
    const result = await execute({
      operation: createWorkOrderDefinition,
      input: kitchenOrder(theirs),
      context,
    });
    expect(errorCode({ result })).toBe("VALIDATION");
    const mine = kitchenOrder(await createWorkOrderSetup({ context }));
    const input = { ...mine, responsibilityId: theirs.responsibility.id };
    const receiver = await execute({ operation: createWorkOrderDefinition, input, context });
    expect(receiver.ok ? [] : receiver.error.issues.map((issue) => issue.path)).toEqual([
      "responsibilityId",
    ]);
  });
});
