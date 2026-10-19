import { describe, expect, it } from "vitest";
import { execute, getUserSettings, updateUserSettings } from "../src/index";
import { testContext, unwrap } from "./helpers";

describe("user settings (ADR 0046)", () => {
  it("reads null before any change, then the saved status, and keeps users apart", async () => {
    const a = testContext();
    const b = testContext();
    const read = ({ context }: { context: typeof a }) =>
      execute({ operation: getUserSettings, input: {}, context });
    expect(unwrap({ result: await read({ context: a }) }).onboardingStatus).toBeNull();
    const set = ({ onboardingStatus }: { onboardingStatus: "PENDING" | "COMPLETED" }) =>
      execute({ operation: updateUserSettings, input: { onboardingStatus }, context: a });
    expect(unwrap({ result: await set({ onboardingStatus: "PENDING" }) }).onboardingStatus).toBe(
      "PENDING",
    );
    unwrap({ result: await set({ onboardingStatus: "COMPLETED" }) });
    expect(unwrap({ result: await read({ context: a }) }).onboardingStatus).toBe("COMPLETED");
    expect(unwrap({ result: await read({ context: b }) }).onboardingStatus).toBeNull();
  });
});
