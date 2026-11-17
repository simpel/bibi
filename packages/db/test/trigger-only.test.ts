import { describe, expect, it } from "vitest";
import { TRIGGER_ONLY_MODELS } from "../src/scoped/append-only-models";
import { applyScope } from "../src/scoped/apply-scope";
import { ScopeViolationError } from "../src/scoped/scope-violation";

const scope = { model: "RecordRelation", organizationId: "org-a", actorId: "user-a" };

const run = ({ operation, args }: { operation: string; args: unknown }) =>
  applyScope({ ...scope, operation, args });

describe("trigger-only projections (ADR 0053, 0113)", () => {
  it("are read through the organization scope", () => {
    const args = { where: { principalId: "user-a" } };
    expect(run({ operation: "findMany", args })).toMatchObject({
      where: { organizationId: "org-a", principalId: "user-a" },
    });
  });

  it.each(["create", "createMany", "update", "updateMany", "upsert", "delete", "deleteMany"])(
    "refuse %s, so only the trigger writes them",
    (operation) => {
      expect(TRIGGER_ONLY_MODELS.has(scope.model)).toBe(true);
      expect(() => run({ operation, args: { data: {}, where: {} } })).toThrow(ScopeViolationError);
    },
  );
});
