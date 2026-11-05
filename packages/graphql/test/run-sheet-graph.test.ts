import { provisionOrganization } from "@bibi/core";
import { FALLBACK_TIME_ZONE } from "@bibi/core/schemas";
import { getDb } from "@bibi/db";
import { describe, expect, it } from "vitest";
import { graphContact } from "./graph-contact";
import { createClient, testContext } from "./helpers";

const TYPE = `mutation($i: EntityTypeCreateInput!) { entityTypeCreate(input: $i) { id } }`;
const CUSTOMER = `mutation($i: CustomerCreateInput!) { customerCreate(input: $i) { id } }`;
const ORDER = `mutation($i: OrderCreateInput!) { orderCreate(input: $i) { id } }`;
const LIST = `mutation($i: VocabularyCreateInput!) { vocabularyCreate(input: $i) { id } }`;
const DEFINITION = `mutation($i: RunSheetDefinitionCreateInput!) { runSheetDefinitionCreate(input: $i) { id } }`;
const GENERATE = `mutation($i: RunSheetGenerateInput!) { runSheetGenerate(input: $i) { id version changes } }`;
const RESPONSIBILITY = `mutation($i: ResponsibilityCreateInput!) { responsibilityCreate(input: $i) { id } }`;
const SEND = `mutation($id: String!) { runSheetPublish(input: { id: $id }) { id } }`;
const READ =
  "query($id: String!) { order(id: $id) { runSheets { version responsibilityId publishedAt } } }";

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

async function runSheetSources({ gql, organizationId }: SourcesInput) {
  const customer = await gql({
    query: CUSTOMER,
    variables: { i: { entityTypeId: await typeId({ gql, base: "CUSTOMER" }), name: "Kvarnby AB" } },
  });
  const order = await gql({
    query: ORDER,
    variables: {
      i: {
        entityTypeId: await typeId({ gql, base: "ORDER" }),
        customerId: customer.body.data.customerCreate.id,
        contactId: await graphContact({ gql, customerId: customer.body.data.customerCreate.id }),
        desiredStartsAt: "2037-11-03T08:00:00.000Z",
        desiredEndsAt: "2037-11-03T16:00:00.000Z",
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
    orderId: order.body.data.orderCreate.id as string,
    runSheetDefinitionId: definition.body.data.runSheetDefinitionCreate.id as string,
  };
}

describe("run sheet graph (ADR 0021)", () => {
  it("generates a version, lists it on the order and sends it while the order is open", async () => {
    const context = testContext();
    expect(
      (
        await provisionOrganization({
          organizationId: context.organizationId,
          timeZone: FALLBACK_TIME_ZONE,
        })
      ).ok,
    ).toBe(true);
    const gql = createClient({ context });
    const input = await runSheetSources({ gql, organizationId: context.organizationId });
    const made = await gql({ query: GENERATE, variables: { i: input } });
    expect(made.body.errors).toBeUndefined();
    expect(made.body.data.runSheetGenerate).toMatchObject({ version: 1, changes: [] });
    const read = await gql({ query: READ, variables: { id: input.orderId } });
    expect(read.body.data.order.runSheets).toMatchObject([{ version: 1, publishedAt: null }]);
    expect(read.body.data.order.runSheets[0].responsibilityId).toEqual(expect.any(String));
    const send = await gql({ query: SEND, variables: { id: made.body.data.runSheetGenerate.id } });
    expect(send.body.errors).toBeUndefined();
  });
});
