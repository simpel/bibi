import { describe, expect, it } from "vitest";
import { applyScope } from "../src/scoped/apply-scope";
import { HARD_DELETE_KEY, withHardDelete } from "../src/scoped/hard-delete-intent";
import { ScopeViolationError } from "../src/scoped/scope-violation";

const scope = { organizationId: "org-a", actorId: "user-a" };

type RunInput = { model: string; operation: string; args: unknown };

const run = ({ model, operation, args }: RunInput) =>
  applyScope({ ...scope, model, operation, args });

describe("hard deletes of soft-deleted models (ADR 0118)", () => {
  it.each(["delete", "deleteMany"])("refuse an undeclared %s", (operation) => {
    const args = { where: { id: "v1" } };
    expect(() => run({ model: "Venue", operation, args })).toThrow(ScopeViolationError);
  });

  it("scope a declared delete to the organization and strip the key", () => {
    const args = { where: { id: "v1" }, [HARD_DELETE_KEY]: true };
    const scoped = run({ model: "Venue", operation: "delete", args });
    expect(scoped).toEqual({ where: { id: "v1", organizationId: "org-a" } });
  });

  it("leave hard-delete models as they were", () => {
    const args = { where: { parentId: "i1" } };
    expect(run({ model: "ItemPart", operation: "deleteMany", args })).toMatchObject({
      where: { parentId: "i1", organizationId: "org-a" },
    });
  });

  it("strip the key from any other query", () => {
    const args = { where: { id: "v1" }, [HARD_DELETE_KEY]: true };
    const scoped = run({ model: "Venue", operation: "findFirst", args });
    expect(scoped).not.toHaveProperty(HARD_DELETE_KEY);
  });

  it("declare the delete only through the view's delete methods", async () => {
    const calls: unknown[] = [];
    const record = ({ ...args }: Record<string, unknown>) => calls.push(args);
    const delegate = { delete: record, deleteMany: record, update: () => null };
    const view = withHardDelete({ client: { venue: delegate } });
    await view.venue.deleteMany({ where: { id: "v1" } });
    expect(calls).toEqual([{ where: { id: "v1" }, [HARD_DELETE_KEY]: true }]);
    expect(view.venue).not.toHaveProperty("update");
  });
});
