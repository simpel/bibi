import { getDb } from "@okazi/db";
import { createBooking, type ExecuteContext, execute, provisionOrganization } from "../src/index";
import { createTestCustomer, createTypeWithField } from "./customer-helpers";
import { unwrap } from "./helpers";
import { addTestMember, testOrg } from "./org-helpers";

export type MemberUserInput = { context: ExecuteContext; name: string };

/** A member of the organization; returns its user id (what assignments refer to). */
export async function memberUser({ context, name }: MemberUserInput): Promise<string> {
  const memberId = await addTestMember({ context, role: "Sales", name });
  const member = await getDb().member.findUniqueOrThrow({ where: { id: memberId } });
  return member.userId;
}

/** An organization provisioned like a real signup, with a booking type and a customer. */
export async function bookingSetup() {
  const context = await testOrg();
  unwrap({ result: await provisionOrganization({ organizationId: context.organizationId }) });
  const { type, key } = await createTypeWithField({ context, base: "BOOKING", name: "Conference" });
  const customer = await createTestCustomer({ context, name: "Hisingen Energi AB" });
  return { context, type, key, customer };
}

export type CreateTestBookingInput = {
  context: ExecuteContext;
  entityTypeId: string;
  customerId: string;
  assigneeId?: string;
  startsAt?: Date;
  endsAt?: Date;
};

/** A booking tomorrow, three hours long, unless a period is given. */
export async function createTestBooking({ context, ...input }: CreateTestBookingInput) {
  const startsAt = new Date(Date.now() + 86_400_000);
  const endsAt = new Date(startsAt.getTime() + 3 * 3_600_000);
  return unwrap({
    result: await execute({
      operation: createBooking,
      input: { startsAt, endsAt, ...input },
      context,
    }),
  });
}
