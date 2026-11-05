import { describe, expect, it } from "vitest";
import { createRunSheetDefinition, execute } from "../src/index";
import { errorCode } from "./helpers";
import { testOrg } from "./org-helpers";
import { createRunSheetSetup, kitchenOrder } from "./run-sheet-definition-helpers";

describe("run sheet definitions across organizations (ADR 0021, 0056)", () => {
  it("never refers to another organization's configuration", async () => {
    const theirs = await createRunSheetSetup({ context: await testOrg() });
    const context = await testOrg();
    const result = await execute({
      operation: createRunSheetDefinition,
      input: kitchenOrder(theirs),
      context,
    });
    expect(errorCode({ result })).toBe("VALIDATION");
    const mine = kitchenOrder(await createRunSheetSetup({ context }));
    const input = { ...mine, responsibilityId: theirs.responsibility.id };
    const receiver = await execute({ operation: createRunSheetDefinition, input, context });
    expect(receiver.ok ? [] : receiver.error.issues.map((issue) => issue.path)).toEqual([
      "responsibilityId",
    ]);
  });
});
