import {
  createConversation,
  createCustomer,
  createEntityType,
  type ExecuteContext,
  execute,
  listMembers,
  listVenues,
  removeMember,
} from "@okazi/core";
import { getDb } from "@okazi/db";
import { describe, expect, it } from "vitest";
import { resolveExecuteContext } from "../src/index";
import { codeOf, signUp } from "./helpers";
import { addMember, memberSession } from "./roles";

const resolve = async ({ headers }: { headers: Headers }): Promise<ExecuteContext> => {
  const result = await resolveExecuteContext({ headers });
  if (!result.ok) throw result.error;
  return result.value;
};

/** A member with `role` plus the owner, both resolved the way every surface resolves them. */
const setup = async ({ role }: { role: "member" | "manager" | "admin" }) => {
  const session = await memberSession({ role });
  const owner = await resolve({ headers: session.owner.headers });
  const caller = await resolve({ headers: session.headers });
  const type = await execute({
    operation: createEntityType,
    input: { base: "CUSTOMER", name: "Company" },
    context: owner,
  });
  if (!type.ok) throw type.error;
  return { ...session, owner, caller, customerTypeId: type.value.id };
};

const newCustomer = ({
  context,
  entityTypeId,
}: {
  context: ExecuteContext;
  entityTypeId: string;
}) => execute({ operation: createCustomer, input: { entityTypeId, name: "Acme" }, context });

const newType = ({ context }: { context: ExecuteContext }) =>
  execute({ operation: createEntityType, input: { base: "ITEM", name: "Dish" }, context });

describe("fixed roles on core operations (ADR 0034)", () => {
  it("lets a viewer read everything but write nothing except its own assistant chats", async () => {
    const { caller, customerTypeId } = await setup({ role: "member" });
    expect(
      codeOf({ result: await execute({ operation: listVenues, input: {}, context: caller }) }),
    ).toBe("OK");
    expect(
      codeOf({ result: await execute({ operation: listMembers, input: {}, context: caller }) }),
    ).toBe("OK");
    expect(
      codeOf({ result: await newCustomer({ context: caller, entityTypeId: customerTypeId }) }),
    ).toBe("FORBIDDEN");
    expect(codeOf({ result: await newType({ context: caller }) })).toBe("FORBIDDEN");
    const chat = await execute({ operation: createConversation, input: {}, context: caller });
    expect(codeOf({ result: chat })).toBe("OK");
  });

  it("lets a member write operational data but not change configuration", async () => {
    const { caller, customerTypeId } = await setup({ role: "manager" });
    expect(
      codeOf({ result: await newCustomer({ context: caller, entityTypeId: customerTypeId }) }),
    ).toBe("OK");
    expect(codeOf({ result: await newType({ context: caller }) })).toBe("FORBIDDEN");
  });

  it("lets an admin configure and manage members, but never remove the last admin", async () => {
    const { caller, organizationId } = await setup({ role: "admin" });
    expect(codeOf({ result: await newType({ context: caller }) })).toBe("OK");
    const second = await signUp();
    await addMember({ organizationId, userId: second.userId, role: "admin" });
    const admins = await getDb().member.findMany({ where: { organizationId, role: "admin" } });
    const codes: string[] = [];
    for (const admin of admins) {
      const result = await execute({
        operation: removeMember,
        input: { id: admin.id },
        context: caller,
      });
      codes.push(codeOf({ result }));
    }
    // Every admin but the last one goes; the last one stays (ADR 0034).
    expect(codes.at(-1)).toBe("CONFLICT");
    expect(codes.slice(0, -1).every((code) => code === "OK")).toBe(true);
    const viewer = await signUp();
    await addMember({ organizationId, userId: viewer.userId, role: "member" });
    const row = await getDb().member.findFirstOrThrow({
      where: { organizationId, userId: viewer.userId },
    });
    const removed = await execute({
      operation: removeMember,
      input: { id: row.id },
      context: caller,
    });
    expect(codeOf({ result: removed })).toBe("OK");
  });
});
