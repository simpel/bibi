import { describe, expect, it } from "vitest";
import { execute, listRunSheets } from "../src/index";
import { runSheetCurrentReconciliation } from "../src/seed/demo/run-sheet-current-reconcile";
import { assignTo, followAs } from "./assignment-helpers";
import { testContext, unwrap } from "./helpers";
import { memberUser } from "./order-helpers";
import { type SetupResult, setCount, runSheetSetup } from "./run-sheet-helpers";

type Context = SetupResult["context"];

/** Two versions of the kitchen order: v1, then v2 after the count changed. */
async function setup() {
  const base = await runSheetSetup();
  const { context, count, order, definition } = base;
  unwrap({ result: await setCount({ context, id: count.id, quantity: 7 }) });
  unwrap({ result: await setCount({ context, id: count.id, quantity: 9 }) });
  const johan = await memberUser({ context, name: "Johan Ek" });
  const asJohan = testContext({
    organizationId: context.organizationId,
    actor: { type: "user", userId: johan },
  });
  const slot = {
    subjectType: "ORDER" as const,
    subjectId: order.id,
    responsibilityId: definition.responsibilityId,
  };
  const search = async ({ q, as = context }: { q: string; as?: Context }) => {
    const input = { q, page: 1, sort: "version" as const, direction: "desc" as const };
    const page = unwrap({
      result: await execute({ operation: listRunSheets, input, context: as }),
    });
    return { versions: page.items.map((item) => item.version), total: page.total };
  };
  return { ...base, johan, asJohan, slot, search };
}

describe("runSheet.list search (GitHub style)", () => {
  it("marks only the newest version current, and is:current keeps it", async () => {
    const { context, search } = await setup();
    expect((await search({ q: "" })).versions).toEqual([2, 1]);
    expect(await search({ q: "is:current" })).toEqual({ versions: [2], total: 1 });
    expect((await search({ q: "-is:current" })).versions).toEqual([1]);
    expect((await search({ q: "is:unsent" })).versions).toEqual([2, 1]);
    expect((await search({ q: "is:sent" })).versions).toEqual([]);
    const rebuilt = await runSheetCurrentReconciliation.rebuild({ context });
    expect(await runSheetCurrentReconciliation.compare({ context, rebuilt })).toEqual([]);
  });

  it("finds the run sheets of the member's slot as assignee, follower or either", async () => {
    const { context, johan, asJohan, slot, search } = await setup();
    expect((await search({ q: "involves:me", as: asJohan })).versions).toEqual([]);
    await followAs({ context, ...slot, userId: johan });
    expect((await search({ q: "follower:me", as: asJohan })).versions).toEqual([2, 1]);
    expect((await search({ q: "assignee:me", as: asJohan })).versions).toEqual([]);
    await assignTo({ context, ...slot, assigneeId: johan });
    expect((await search({ q: "assignee:johan" })).versions).toEqual([2, 1]);
    expect(await search({ q: "involves:me is:current", as: asJohan })).toEqual({
      versions: [2],
      total: 1,
    });
    expect((await search({ q: "-involves:me", as: asJohan })).versions).toEqual([]);
    const either = await search({ q: "assignee:me follower:me", as: asJohan });
    expect(either.versions).toEqual([2, 1]);
  });

  it("filters by the definition, the order's qualifiers and its reference", async () => {
    const { order, search } = await setup();
    expect((await search({ q: 'definition:"Kitchen order"' })).versions).toEqual([2, 1]);
    expect((await search({ q: "definition:Other" })).versions).toEqual([]);
    expect((await search({ q: "is:open" })).versions).toEqual([2, 1]);
    expect((await search({ q: "is:closed" })).versions).toEqual([]);
    expect((await search({ q: `#${order.reference}` })).versions).toEqual([2, 1]);
    expect((await search({ q: `${order.reference + 1}` })).versions).toEqual([]);
  });
});
