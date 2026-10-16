import { provisionOrganization } from "@okazi/core";
import { describe, expect, it } from "vitest";
import { createClient, testContext } from "./helpers";

const TYPE = `mutation($i: EntityTypeCreateInput!) { entityTypeCreate(input: $i) { id } }`;
const CUSTOMER = `mutation($i: CustomerCreateInput!) { customerCreate(input: $i) { id } }`;
const BOOKING = `mutation($i: BookingCreateInput!) { bookingCreate(input: $i) { id } }`;
const LIST = `mutation($i: VocabularyCreateInput!) { vocabularyCreate(input: $i) { id } }`;
const DEFINITION = `mutation($i: SheetDefinitionCreateInput!) { sheetDefinitionCreate(input: $i) { id } }`;
const GENERATE = `mutation($i: SheetGenerateInput!) { sheetGenerate(input: $i) { id version changes } }`;
const SEND = `mutation($id: String!) { sheetSend(input: { id: $id }) { id } }`;
const READ = "query($id: String!) { booking(id: $id) { sheets { version roleId sentAt } } }";

type Gql = ReturnType<typeof createClient>;
type TypeInput = { gql: Gql; base: string };

const typeId = async ({ gql, base }: TypeInput) =>
  (await gql({ query: TYPE, variables: { i: { base, name: `${base} type` } } })).body.data
    .entityTypeCreate.id as string;

async function sheetSources({ gql }: { gql: Gql }) {
  const customer = await gql({
    query: CUSTOMER,
    variables: { i: { entityTypeId: await typeId({ gql, base: "CUSTOMER" }), name: "Kvarnby AB" } },
  });
  const booking = await gql({
    query: BOOKING,
    variables: {
      i: {
        entityTypeId: await typeId({ gql, base: "BOOKING" }),
        customerId: customer.body.data.customerCreate.id,
        startsAt: "2026-11-03T08:00:00.000Z",
        endsAt: "2026-11-03T16:00:00.000Z",
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
        roleId: "owner",
      },
    },
  });
  return {
    bookingId: booking.body.data.bookingCreate.id as string,
    sheetDefinitionId: definition.body.data.sheetDefinitionCreate.id as string,
  };
}

describe("sheet graph (ADR 0021)", () => {
  it("generates a version, lists it on the booking and refuses to send while tentative", async () => {
    const context = testContext();
    expect((await provisionOrganization({ organizationId: context.organizationId })).ok).toBe(true);
    const gql = createClient({ context });
    const input = await sheetSources({ gql });
    const made = await gql({ query: GENERATE, variables: { i: input } });
    expect(made.body.errors).toBeUndefined();
    expect(made.body.data.sheetGenerate).toMatchObject({ version: 1, changes: [] });
    const read = await gql({ query: READ, variables: { id: input.bookingId } });
    expect(read.body.data.booking.sheets).toEqual([{ version: 1, roleId: "owner", sentAt: null }]);
    const send = await gql({ query: SEND, variables: { id: made.body.data.sheetGenerate.id } });
    expect(send.body.errors?.[0]?.extensions?.code).toBe("CONFLICT");
  });
});
