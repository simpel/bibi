import { describe, expect, it } from "vitest";
import { createSheetDefinition, execute } from "../src/index";
import { errorCode } from "./helpers";
import { testOrg } from "./org-helpers";
import { createSheetSetup, kitchenOrder } from "./sheet-definition-helpers";

describe("sheet definitions across organizations (ADR 0021, 0056)", () => {
  it("never refers to another organization's configuration", async () => {
    const theirs = await createSheetSetup({ context: await testOrg() });
    const context = await testOrg();
    const result = await execute({
      operation: createSheetDefinition,
      input: kitchenOrder(theirs),
      context,
    });
    expect(errorCode({ result })).toBe("VALIDATION");
    const mine = kitchenOrder(await createSheetSetup({ context }));
    const input = { ...mine, responsibilityId: theirs.responsibility.id };
    const receiver = await execute({ operation: createSheetDefinition, input, context });
    expect(receiver.ok ? [] : receiver.error.issues.map((issue) => issue.path)).toEqual([
      "responsibilityId",
    ]);
  });
});
