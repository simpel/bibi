import { describe, expect, it } from "vitest";
import {
  archiveConversation,
  createConversation,
  type ExecuteContext,
  execute,
  getConversation,
  listConversations,
  renameConversation,
} from "../src/index";
import { errorCode, peer, testContext, unwrap } from "./helpers";

describe("conversation operations", () => {
  it("creates, lists, renames and archives the caller's own conversations", async () => {
    const context = testContext({ access: "write" });
    const created = unwrap({
      result: await execute({ operation: createConversation, input: {}, context }),
    });
    expect(created).toMatchObject({ title: "New conversation", status: "ACTIVE" });
    expect(created.ownerUserId).toBe(context.actor.userId);
    const renamed = unwrap({
      result: await execute({
        operation: renameConversation,
        input: { id: created.id, title: "Quote Volvo" },
        context,
      }),
    });
    expect(renamed.title).toBe("Quote Volvo");
    const list = unwrap({
      result: await execute({ operation: listConversations, input: {}, context }),
    });
    expect(list.items.map((item) => item.id)).toEqual([created.id]);
    await execute({ operation: archiveConversation, input: { id: created.id }, context });
    const after = await execute({ operation: getConversation, input: { id: created.id }, context });
    expect(errorCode({ result: after })).toBe("NOT_FOUND");
    const archived = unwrap({
      result: await execute({
        operation: listConversations,
        input: { status: "ARCHIVED" },
        context,
      }),
    });
    expect(archived.items.map((item) => item.id)).toEqual([created.id]);
  });

  it("keeps conversations private: members never see others', admins may read but not write", async () => {
    const owner = testContext({ access: "write" });
    const member = peer({ of: owner });
    const admin = peer({ of: owner, access: "admin" });
    const other = testContext({ access: "admin" });
    const { id } = unwrap({
      result: await execute({
        operation: createConversation,
        input: { title: "Privat" },
        context: owner,
      }),
    });
    const get = ({ context }: { context: ExecuteContext }) =>
      execute({ operation: getConversation, input: { id }, context });
    expect(errorCode({ result: await get({ context: member }) })).toBe("NOT_FOUND");
    expect(errorCode({ result: await get({ context: other }) })).toBe("NOT_FOUND");
    expect(errorCode({ result: await get({ context: admin }) })).toBeNull();

    const memberList = unwrap({
      result: await execute({ operation: listConversations, input: {}, context: member }),
    });
    expect(memberList.items).toEqual([]);
    const allAsMember = await execute({
      operation: listConversations,
      input: { allUsers: true },
      context: member,
    });
    expect(errorCode({ result: allAsMember })).toBe("FORBIDDEN");
    const allAsAdmin = unwrap({
      result: await execute({
        operation: listConversations,
        input: { allUsers: true },
        context: admin,
      }),
    });
    expect(allAsAdmin.items.map((item) => item.id)).toEqual([id]);

    const rename = ({ context }: { context: ExecuteContext }) =>
      execute({ operation: renameConversation, input: { id, title: "Hijack" }, context });
    expect(errorCode({ result: await rename({ context: member }) })).toBe("NOT_FOUND");
    expect(errorCode({ result: await rename({ context: admin }) })).toBe("NOT_FOUND");
    expect(errorCode({ result: await rename({ context: other }) })).toBe("NOT_FOUND");
    const archiveAsMember = await execute({
      operation: archiveConversation,
      input: { id },
      context: member,
    });
    expect(errorCode({ result: archiveAsMember })).toBe("NOT_FOUND");
    const archiveAsAdmin = await execute({
      operation: archiveConversation,
      input: { id },
      context: admin,
    });
    expect(errorCode({ result: archiveAsAdmin })).toBeNull();
  });

  it("lets every member keep their own conversations, but needs a user owner", async () => {
    const member = testContext({ access: "read" });
    const own = await execute({ operation: createConversation, input: {}, context: member });
    expect(errorCode({ result: own })).toBeNull();
    const system = testContext({ actor: { type: "system", userId: null } });
    const ownerless = await execute({ operation: createConversation, input: {}, context: system });
    expect(errorCode({ result: ownerless })).toBe("VALIDATION");
  });

  it("does not require approval for the assistant's own bookkeeping, but does for archive", () => {
    expect(createConversation.approval).toBe(false);
    expect(renameConversation.approval).toBe(false);
    expect(archiveConversation.approval).toBe(true);
  });
});
