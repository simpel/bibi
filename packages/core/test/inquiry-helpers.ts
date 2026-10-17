import {
  createContact,
  createEntityType,
  createInquiry,
  type ExecuteContext,
  execute,
  provisionOrganization,
} from "../src/index";
import { createTestCustomer, createTypeWithField } from "./customer-helpers";
import { unwrap } from "./helpers";
import { testOrg } from "./org-helpers";

/** An organization provisioned like a real signup, with an inquiry type and a customer. */
export async function inquirySetup() {
  const context = await testOrg();
  unwrap({ result: await provisionOrganization({ organizationId: context.organizationId }) });
  const { type, key } = await createTypeWithField({ context, base: "INQUIRY", name: "Meeting" });
  const customer = await createTestCustomer({ context, name: "Hisingen Energi AB" });
  return { context, type, key, customer };
}

export type CreateTestContactInput = { context: ExecuteContext; customerId: string };

/** A contact person at the customer, of a fresh CONTACT type. */
export async function createTestContact({ context, customerId }: CreateTestContactInput) {
  const type = unwrap({
    result: await execute({
      operation: createEntityType,
      input: { base: "CONTACT", name: `Contact ${customerId}` },
      context,
    }),
  });
  return unwrap({
    result: await execute({
      operation: createContact,
      input: { customerId, entityTypeId: type.id, name: "Anna Berg" },
      context,
    }),
  });
}

export type CreateTestInquiryInput = {
  context: ExecuteContext;
  entityTypeId: string;
  customerId: string;
  assigneeId?: string;
};

/** A NEW inquiry for 20 people. */
export async function createTestInquiry({ context, ...input }: CreateTestInquiryInput) {
  return unwrap({
    result: await execute({
      operation: createInquiry,
      input: { quantity: 20, ...input },
      context,
    }),
  });
}
