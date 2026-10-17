import { describe, expect, it } from "vitest";
import { applyScope } from "../src/scoped/apply-scope";
import { USER_SCOPED_MODELS } from "../src/scoped/models";
import { ScopeViolationError } from "../src/scoped/scope-violation";
import { SYSTEM_ACTOR_ID } from "../src/scoped/system-actor";
import { fieldOf, readSchemaModels } from "./read-schema";

const scope = { model: "UserPreference", organizationId: "org-a", actorId: "user-a" };

type RunInput = { operation: string; args: unknown; actorId?: string };

const run = ({ operation, args, actorId = scope.actorId }: RunInput) =>
  applyScope({ ...scope, actorId, operation, args });

describe("user-scoped models (ADR 0039)", () => {
  it("have a required userId and no organizationId", () => {
    const models = readSchemaModels().filter((model) => USER_SCOPED_MODELS.has(model.name));
    expect(models.map((model) => model.name).sort()).toEqual([...USER_SCOPED_MODELS].sort());
    for (const model of models) {
      expect(fieldOf({ model, name: "userId" })?.type, model.name).toBe("String");
      expect(fieldOf({ model, name: "organizationId" }), model.name).toBeUndefined();
    }
  });

  it("pins reads to the acting user, whatever the caller asked for", () => {
    const args = { where: { userId: "user-b", key: "a" } };
    expect(run({ operation: "findMany", args })).toEqual({ where: { userId: "user-a", key: "a" } });
  });

  it("forces the acting user on creates and upserts, and never moves a row", () => {
    const created = run({ operation: "create", args: { data: { userId: "user-b", key: "a" } } });
    expect(created).toMatchObject({ data: { userId: "user-a" } });
    const upsert = run({
      operation: "upsert",
      args: {
        where: { userId_key: { userId: "user-b", key: "a" } },
        create: { userId: "user-b", key: "a", value: 1 },
        update: { userId: "user-b", value: 2 },
      },
    });
    expect(upsert).toMatchObject({ where: { userId: "user-a" }, create: { userId: "user-a" } });
    expect(upsert.update).toEqual({ value: 2 });
  });

  it("refuses the system actor", () => {
    const args = { where: {} };
    expect(() => run({ operation: "findMany", args, actorId: SYSTEM_ACTOR_ID })).toThrow(
      ScopeViolationError,
    );
  });
});
