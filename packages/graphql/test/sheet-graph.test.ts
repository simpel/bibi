import { provisionOrganization } from "@bibi/core";
import { getDb } from "@bibi/db";
import { describe, expect, it } from "vitest";
import { createClient, testContext } from "./helpers";

const TYPE = `mutation($i: EntityTypeCreateInput!) { entityTypeCreate(input: $i) { id } }`;
const CUSTOMER = `mutation($i: CustomerCreateInput!) { customerCreate(input: $i) { id } }`;
const TICKET = `mutation($i: TicketCreateInput!) { ticketCreate(input: $i) { id } }`;
const LIST = `mutation($i: VocabularyCreateInput!) { vocabularyCreate(input: $i) { id } }`;
const DEFINITION = `mutation($i: SheetDefinitionCreateInput!) { sheetDefinitionCreate(input: $i) { id } }`;
const GENERATE = `mutation($i: SheetGenerateInput!) { sheetGenerate(input: $i) { id version changes } }`;
const RESPONSIBILITY = `mutation($i: ResponsibilityCreateInput!) { responsibilityCreate(input: $i) { id } }`;
const SEND = `mutation($id: String!) { sheetSend(input: { id: $id }) { id } }`;
const READ =
  "query($id: String!) { ticket(id: $id) { sheets { version responsibilityId sentAt } } }";

type Gql = ReturnType<typeof createClient>;
type TypeInput = { gql: Gql; base: string };

const typeId = async ({ gql, base }: TypeInput) =>
  (await gql({ query: TYPE, variables: { i: { base, name: `${base} type` } } })).body.data
    .entityTypeCreate.id as string;

type SourcesInput = { gql: Gql; organizationId: string };

/** Head of kitchen, defaulting to a new member (with the Better Auth rows it needs). */
async function receiver({ gql, organizationId }: SourcesInput) {
  const userId = `user_chef_${organizationId}`;
  const db = getDb();
  const createdAt = new Date();
  await db.organization.create({
    data: { id: organizationId, name: organizationId, slug: organizationId, createdAt },
  });
  await db.user.create({ data: { id: userId, name: "Chef", email: `${userId}@x.test` } });
  await db.member.create({
    data: { id: `member_${userId}`, organizationId, userId, role: "member", createdAt },
  });
  const made = await gql({
    query: RESPONSIBILITY,
    variables: { i: { name: "Head of kitchen", defaultAssigneeId: userId } },
  });
  return made.body.data.responsibilityCreate.id as string;
}

async function sheetSources({ gql, organizationId }: SourcesInput) {
  const customer = await gql({
    query: CUSTOMER,
    variables: { i: { entityTypeId: await typeId({ gql, base: "CUSTOMER" }), name: "Kvarnby AB" } },
  });
  const ticket = await gql({
    query: TICKET,
    variables: {
      i: {
        entityTypeId: await typeId({ gql, base: "TICKET" }),
        customerId: customer.body.data.customerCreate.id,
        desiredStartsAt: "2026-11-03T08:00:00.000Z",
        desiredEndsAt: "2026-11-03T16:00:00.000Z",
      },
    },
  });
  const list = await gql({ query: LIST, variables: { i: { name: "Allergens" } } });
  const definition = await gql({
    query: DEFINITION,
    variables: {
      i: {
        name: "Kitchen order",
        vocabularyIds: [list.body.data.vocabularyCreate.id],
        responsibilityId: await receiver({ gql, organizationId }),
      },
    },
  });
  return {
    ticketId: ticket.body.data.ticketCreate.id as string,
    sheetDefinitionId: definition.body.data.sheetDefinitionCreate.id as string,
  };
}

describe("sheet graph (ADR 0021)", () => {
  it("generates a version, lists it on the ticket and sends it while the ticket is open", async () => {
    const context = testContext();
    expect((await provisionOrganization({ organizationId: context.organizationId })).ok).toBe(true);
    const gql = createClient({ context });
    const input = await sheetSources({ gql, organizationId: context.organizationId });
    const made = await gql({ query: GENERATE, variables: { i: input } });
    expect(made.body.errors).toBeUndefined();
    expect(made.body.data.sheetGenerate).toMatchObject({ version: 1, changes: [] });
    const read = await gql({ query: READ, variables: { id: input.ticketId } });
    expect(read.body.data.ticket.sheets).toMatchObject([{ version: 1, sentAt: null }]);
    expect(read.body.data.ticket.sheets[0].responsibilityId).toEqual(expect.any(String));
    const send = await gql({ query: SEND, variables: { id: made.body.data.sheetGenerate.id } });
    expect(send.body.errors).toBeUndefined();
  });
});
