import { describe, expect, it } from "vitest";
import { applyScope } from "../src/scoped/apply-scope";
import { ScopeViolationError } from "../src/scoped/scope-violation";

const scope = { model: "Item", organizationId: "org-a", actorId: "user-a" };

type ScopeArgsInput = { operation: string; args: unknown };

function run({ operation, args }: ScopeArgsInput) {
  return () => applyScope({ ...scope, operation, args });
}

const setupRow = { setupId: "s1", capacity: 10 };

describe("applyScope rejects nested relation writes (#95)", () => {
  it.each([
    ["create", { create: [setupRow] }],
    ["createMany", { createMany: { data: [setupRow] } }],
    ["connectOrCreate", { connectOrCreate: { where: { id: "x" }, create: setupRow } }],
    ["upsert", { upsert: { where: { id: "x" }, create: setupRow, update: {} } }],
  ])("rejects a nested %s inside create data", (_name, setups) => {
    const args = { data: { name: "Room", setups } };
    expect(run({ operation: "create", args })).toThrow(ScopeViolationError);
  });

  it("rejects a nested create in a createMany row", () => {
    const args = { data: [{ name: "Room" }, { name: "Hall", setups: { create: [setupRow] } }] };
    expect(run({ operation: "createMany", args })).toThrow(ScopeViolationError);
  });

  it("rejects a nested create in a top-level upsert's create and update", () => {
    const nested = { setups: { create: [setupRow] } };
    const where = { id: "i1" };
    const inCreate = { where, create: { name: "Room", ...nested }, update: {} };
    const inUpdate = { where, create: { name: "Room" }, update: nested };
    expect(run({ operation: "upsert", args: inCreate })).toThrow(ScopeViolationError);
    expect(run({ operation: "upsert", args: inUpdate })).toThrow(ScopeViolationError);
  });

  it.each([["create"], ["update"], ["delete"], ["deleteMany"]])(
    "rejects a nested %s inside update data",
    (key) => {
      const args = { where: { id: "i1" }, data: { setups: { [key]: [{ id: "x" }] } } };
      expect(run({ operation: "update", args })).toThrow(ScopeViolationError);
    },
  );

  it("allows linking existing rows and scalar update operators", () => {
    const data = { venue: { connect: { id: "v1" } }, priceMinor: { increment: 1 } };
    const result = applyScope({
      ...scope,
      operation: "update",
      args: { where: { id: "i1" }, data },
    });
    expect(result.data).toEqual(data);
  });

  it("does not mistake a Json column for a relation", () => {
    const fields = { create: "yes", upsert: { a: 1 } };
    const result = applyScope({ ...scope, operation: "create", args: { data: { fields } } });
    expect(result.data).toEqual({ fields, organizationId: "org-a", createdBy: "user-a" });
  });
});
