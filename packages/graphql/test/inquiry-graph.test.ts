import { describe, expect, it } from "vitest";
import { createClient, testContext } from "./helpers";

const TYPE = `mutation($i: EntityTypeCreateInput!) { entityTypeCreate(input: $i) { id } }`;
const CUSTOMER = `mutation($i: CustomerCreateInput!) { customerCreate(input: $i) { id } }`;
const INQUIRY = `mutation($i: InquiryCreateInput!) { inquiryCreate(input: $i) { id inquiryStatus } }`;
const UPDATE = `mutation($i: InquiryUpdateInput!) { inquiryUpdate(input: $i) { id } }`;
const LOST = `mutation($i: InquiryMarkLostInput!) { inquiryMarkLost(input: $i) {
  inquiryStatus lossReason customer { inquiries { id } } } }`;
const QUALIFY = `mutation($i: InquiryQualifyInput!) { inquiryQualify(input: $i) { id } }`;

describe("inquiry graph (ADR 0022)", () => {
  it("changes status only through the inquiry's own mutations", async () => {
    const gql = createClient({ context: testContext() });
    const type = async ({ base }: { base: string }) =>
      (await gql({ query: TYPE, variables: { i: { base, name: `${base} type` } } })).body.data
        .entityTypeCreate.id as string;
    const customer = await gql({
      query: CUSTOMER,
      variables: { i: { entityTypeId: await type({ base: "CUSTOMER" }), name: "Kvarnby AB" } },
    });
    const customerId = customer.body.data.customerCreate.id;
    const created = await gql({
      query: INQUIRY,
      variables: { i: { entityTypeId: await type({ base: "INQUIRY" }), customerId } },
    });
    expect(created.body.errors).toBeUndefined();
    const { id, inquiryStatus } = created.body.data.inquiryCreate;
    expect(inquiryStatus).toBe("NEW");
    const sneaky = await gql({ query: UPDATE, variables: { i: { id, inquiryStatus: "WON" } } });
    expect(sneaky.body.errors).toBeDefined();
    const lost = await gql({ query: LOST, variables: { i: { id, lossReason: "Too far away" } } });
    expect(lost.body.errors).toBeUndefined();
    expect(lost.body.data.inquiryMarkLost).toEqual({
      inquiryStatus: "LOST",
      lossReason: "Too far away",
      customer: { inquiries: [{ id }] },
    });
    const again = await gql({ query: QUALIFY, variables: { i: { id, salesOwnerId: "x" } } });
    expect(again.body.errors?.[0]?.extensions?.code).toBe("CONFLICT");
  });
});
