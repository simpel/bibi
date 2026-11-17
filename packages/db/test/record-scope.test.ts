import { describe, expect, it } from "vitest";
import { applyRecordScope } from "../src/scoped/apply-record-scope";
import { RECORD_INTENT_KEY, type RecordIntent } from "../src/scoped/record-intent";
import { ScopeViolationError } from "../src/scoped/scope-violation";

const scoped = new Map([
  ["Order", "order"],
  ["Line", "order"],
  ["Quote", "order"],
]);
const mine = { record: { relations: { some: { principalId: "u1" } } } };
const lineMine = { order: mine };
const related: RecordIntent = {
  kind: "records",
  predicates: { Order: mine, Line: lineMine, Quote: lineMine },
};
const everything: RecordIntent = {
  kind: "records",
  predicates: { Order: null, Line: null, Quote: null },
};

type RunInput = { model: string; operation?: string; args: Record<string, unknown> };
const run = ({ model, operation = "findMany", args }: RunInput) =>
  applyRecordScope({ model, operation, args, scoped });
type AsInput = { intent: RecordIntent; args: Record<string, unknown> };
const as = ({ intent, args }: AsInput) => ({ ...args, [RECORD_INTENT_KEY]: intent });

describe("record scope enforcement (ADR 0113)", () => {
  it("refuses the plain client on a record-scoped model and on hops into one", () => {
    expect(() => run({ model: "Order", args: {} })).toThrow(ScopeViolationError);
    expect(() => run({ model: "Customer", args: { include: { orders: true } } })).toThrow(
      /record-scoped/,
    );
    expect(() =>
      run({ model: "Customer", args: { where: { orders: { some: { title: "x" } } } } }),
    ).toThrow(/record-scoped/);
    expect(run({ model: "Customer", args: { where: { name: "x" } } })).toEqual({
      where: { name: "x" },
    });
  });

  it("adds the caller's filter at the top level, and nothing when they see every record", () => {
    expect(
      run({ model: "Order", args: as({ intent: related, args: { where: { title: "x" } } }) }),
    ).toEqual({
      where: { AND: [{ title: "x" }, mine] },
    });
    expect(run({ model: "Order", args: as({ intent: related, args: {} }) })).toEqual({
      where: mine,
    });
    expect(
      run({ model: "Order", args: as({ intent: everything, args: { where: { title: "x" } } }) }),
    ).toEqual({
      where: { title: "x" },
    });
  });

  it("limits list relations from another root and keeps hops inside the root free", () => {
    const included = run({
      model: "Customer",
      args: as({ intent: related, args: { include: { orders: true } } }),
    });
    expect(included).toEqual({ include: { orders: { where: mine } } });
    const narrowed = run({
      model: "Customer",
      args: as({ intent: related, args: { include: { orders: { where: { title: "x" } } } } }),
    });
    expect(narrowed).toEqual({ include: { orders: { where: { AND: [{ title: "x" }, mine] } } } });
    const inside = run({
      model: "Line",
      args: as({ intent: related, args: { include: { order: true } } }),
    });
    expect(inside).toEqual({ where: lineMine, include: { order: true } });
  });

  it("refuses a single record-scoped relation from another root, which cannot be filtered", () => {
    expect(() =>
      run({ model: "Occupancy", args: as({ intent: related, args: { include: { line: true } } }) }),
    ).toThrow(/single record-scoped Line/);
    expect(() =>
      run({
        model: "Occupancy",
        args: as({ intent: related, args: { select: { line: { select: { id: true } } } } }),
      }),
    ).toThrow(/single/);
  });

  it("limits relation filters: some and none to visible records, every over visible ones", () => {
    const where = { orders: { some: { title: "a" }, none: { title: "b" }, every: { title: "c" } } };
    expect(run({ model: "Customer", args: as({ intent: related, args: { where } }) })).toEqual({
      where: {
        orders: {
          some: { AND: [{ title: "a" }, mine] },
          none: { AND: [{ title: "b" }, mine] },
          every: { OR: [{ NOT: mine }, { title: "c" }] },
        },
      },
    });
    const one = run({
      model: "Occupancy",
      args: as({ intent: related, args: { where: { line: { name: "x" } } } }),
    });
    expect(one).toEqual({ where: { line: { AND: [{ name: "x" }, lineMine] } } });
    expect(() =>
      run({
        model: "Occupancy",
        args: as({ intent: related, args: { where: { line: { isNot: { name: "x" } } } } }),
      }),
    ).toThrow(/isNot/);
  });

  it("limits named counts and refuses a blanket count over hidden records", () => {
    const named = run({
      model: "Customer",
      args: as({ intent: related, args: { include: { _count: { select: { orders: true } } } } }),
    });
    expect(named).toEqual({ include: { _count: { select: { orders: { where: mine } } } } });
    expect(() =>
      run({
        model: "Customer",
        args: as({ intent: related, args: { include: { _count: true } } }),
      }),
    ).toThrow(/_count: true/);
  });

  it("lets an engine read see every row, and always strips the intent", () => {
    const engine: RecordIntent = { kind: "engine", purpose: "capacity" };
    expect(
      run({ model: "Order", args: as({ intent: engine, args: { where: { title: "x" } } }) }),
    ).toEqual({
      where: { title: "x" },
    });
    expect(
      run({ model: "Occupancy", args: as({ intent: engine, args: { include: { line: true } } }) }),
    ).toEqual({
      include: { line: true },
    });
  });

  it("refuses a malformed intent, a missing predicate and an upsert", () => {
    const bad = { [RECORD_INTENT_KEY]: { kind: "engine", purpose: "whatever" } };
    expect(() => run({ model: "Customer", args: bad })).toThrow(/malformed/);
    const partial: RecordIntent = { kind: "records", predicates: { Order: mine } };
    expect(() =>
      run({
        model: "Customer",
        args: as({ intent: partial, args: { include: { orders: true } } }),
      }),
    ).not.toThrow();
    expect(() => run({ model: "Line", args: as({ intent: partial, args: {} }) })).toThrow(
      /no record scope given/,
    );
    expect(() =>
      run({ model: "Order", operation: "upsert", args: as({ intent: related, args: {} }) }),
    ).toThrow(/upsert/);
  });
});
