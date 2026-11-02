import { describe, expect, it } from "vitest";
import { execute, listTickets, PRESET_PERMISSIONS } from "../src/index";
import { assignTo, followAs, ticketSubject } from "./assignment-helpers";
import { createTestCustomer } from "./customer-helpers";
import { testContext, unwrap } from "./helpers";
import { createTestTicket, memberUser, ticketSetup } from "./ticket-helpers";

type Context = ReturnType<typeof testContext>;

async function setup() {
  const { context, type, customer } = await ticketSetup();
  const kvarnby = await createTestCustomer({ context, name: "Kvarnby Design AB" });
  const book = ({ customerId }: { customerId: string }) =>
    createTestTicket({ context, entityTypeId: type.id, customerId });
  const [first, second, third] = [
    await book({ customerId: customer.id }),
    await book({ customerId: kvarnby.id }),
    await book({ customerId: customer.id }),
  ];
  const johan = await memberUser({ context, name: "Johan Ek" });
  await assignTo({ context, ...ticketSubject(first), assigneeId: johan });
  await followAs({ context, ...ticketSubject(second), userId: johan });
  const asJohan = testContext({
    organizationId: context.organizationId,
    actor: { type: "user", userId: johan },
  });
  const search = async ({ q, as = context }: { q: string; as?: Context }) => {
    const page = unwrap({
      result: await execute({ operation: listTickets, input: { q, page: 1 }, context: as }),
    });
    return page.items.map((item) => item.reference).sort();
  };
  return { context, type, first, second, third, asJohan, search };
}

describe("ticket.list qualifiers (GitHub style)", () => {
  it("filters by assignee and follower, me or a member's name, and excludes with -", async () => {
    const { asJohan, search } = await setup();
    expect(await search({ q: "assignee:me", as: asJohan })).toEqual([1]);
    expect(await search({ q: "follower:me", as: asJohan })).toEqual([2]);
    expect(await search({ q: "assignee:johan" })).toEqual([1]);
    expect(await search({ q: "-assignee:johan" })).toEqual([2, 3]);
    expect(await search({ q: 'assignee:"johan ek"' })).toEqual([1]);
  });

  it("filters by status, type, customer and open or closed", async () => {
    const { type, search } = await setup();
    expect(await search({ q: "status:lead" })).toEqual([1, 2, 3]);
    expect(await search({ q: "-status:Lead,Offer" })).toEqual([]);
    expect(await search({ q: `type:"${type.name}"` })).toEqual([1, 2, 3]);
    expect(await search({ q: "customer:kvarnby" })).toEqual([2]);
    expect(await search({ q: "is:open -customer:kvarnby" })).toEqual([1, 3]);
    expect(await search({ q: "is:closed" })).toEqual([]);
    expect(await search({ q: "is:whatever" })).toEqual([]);
  });

  it("combines qualifiers with free text", async () => {
    const { search } = await setup();
    expect(await search({ q: "status:Lead #3" })).toEqual([3]);
  });

  it("matches nothing for qualifiers on features the caller may not view (ADR 0071)", async () => {
    const { context, search } = await setup();
    const blind = testContext({
      organizationId: context.organizationId,
      permissions: { ...PRESET_PERMISSIONS.admin, customer: [], member: [] },
    });
    expect(await search({ q: "customer:kvarnby", as: blind })).toEqual([]);
    expect(await search({ q: "assignee:johan", as: blind })).toEqual([]);
  });
});
