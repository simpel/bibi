import { describe, expect, it } from "vitest";
import { execute, listTickets } from "../src/index";
import { assignTo, ticketSubject } from "./assignment-helpers";
import { testContext, unwrap } from "./helpers";
import { createTestTicket, memberUser, ticketSetup } from "./ticket-helpers";

const NOW = new Date("2030-12-01T12:00:00Z");

async function setup() {
  const { context, type, customer } = await ticketSetup();
  const book = ({ ...input }: Record<string, unknown>) =>
    createTestTicket({ context, entityTypeId: type.id, customerId: customer.id, ...input });
  const first = await book({
    desiredStartsAt: new Date("2030-12-24T09:00:00Z"),
    desiredEndsAt: new Date("2030-12-24T15:00:00Z"),
    estimatedHeadcount: 80,
    budgetMinor: 5_000_000,
    holdsUntil: new Date("2030-12-03T12:00:00Z"),
  });
  await book({
    desiredStartsAt: new Date("2031-01-15T09:00:00Z"),
    desiredEndsAt: new Date("2031-01-15T15:00:00Z"),
    estimatedHeadcount: 80,
    guaranteedHeadcount: 20,
    holdsUntil: new Date("2030-11-20T12:00:00Z"),
  });
  await book({ desiredStartsAt: null, desiredEndsAt: null, estimatedHeadcount: null });
  const johan = await memberUser({ context, name: "Johan Ek" });
  await assignTo({ context, ...ticketSubject(first), assigneeId: johan });
  const clock = testContext({ organizationId: context.organizationId });
  clock.now = () => NOW;
  const search = async ({ q }: { q: string }) => {
    const input = { q, page: 1 };
    const page = unwrap({
      result: await execute({ operation: listTickets, input, context: clock }),
    });
    return page.items.map((item) => item.reference).sort();
  };
  return { search };
}

describe("ticket.list date and number qualifiers", () => {
  it("filters the desired start by day, month, comparison and range", async () => {
    const { search } = await setup();
    expect(await search({ q: "when:2030-12-24" })).toEqual([1]);
    expect(await search({ q: "when:2031-01" })).toEqual([2]);
    expect(await search({ q: "when:>2030-12-24" })).toEqual([2]);
    expect(await search({ q: "when:2030-12-01..2031-01-31" })).toEqual([1, 2]);
    expect(await search({ q: "when:tomorrow" })).toEqual([]);
  });

  it("filters guests (the guarantee wins) and the budget in whole units", async () => {
    const { search } = await setup();
    expect(await search({ q: "guests:>50" })).toEqual([1]);
    expect(await search({ q: "guests:<=20" })).toEqual([2]);
    expect(await search({ q: "budget:>=50000" })).toEqual([1]);
    expect(await search({ q: "budget:<50000" })).toEqual([]);
  });

  it("filters holds and empty fields, and created dates", async () => {
    const { search } = await setup();
    expect(await search({ q: "holds:soon" })).toEqual([1]);
    expect(await search({ q: "holds:expired" })).toEqual([2]);
    expect(await search({ q: "no:date" })).toEqual([3]);
    expect(await search({ q: "no:guests no:holds" })).toEqual([3]);
    expect(await search({ q: "no:assignee" })).toEqual([2, 3]);
    expect(await search({ q: "-no:budget" })).toEqual([1]);
    expect(await search({ q: "no:everything" })).toEqual([]);
    expect(await search({ q: "created:>2000" })).toEqual([1, 2, 3]);
  });
});
