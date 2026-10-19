import {
  cancelInvitation,
  createExecuteContext,
  execute,
  grantAll,
  type InvitationDto,
  inviteMember,
} from "@okazi/core";
import { getDb } from "@okazi/db";
import { afterEach, describe, expect, it } from "vitest";
import { getAuth, invitationMailHook } from "../src/index";
import { installFakeMail, uninstallFakeMail } from "./fake-mail";
import { createOrg, signUp, type TestUser } from "./helpers";
import { addMember } from "./roles";

afterEach(() => uninstallFakeMail());

const ownerContext = ({ organizationId, owner }: { organizationId: string; owner: TestUser }) =>
  createExecuteContext({
    organizationId,
    roles: ["admin"],
    permissions: grantAll({}),
    actor: { type: "user", userId: owner.userId },
  });

const inviteAs = async ({ invitee }: { invitee: TestUser }) => {
  const owner = await signUp();
  const organizationId = await createOrg({ headers: owner.headers });
  const context = ownerContext({ organizationId, owner });
  const result = await execute({
    operation: inviteMember,
    input: { email: invitee.email, role: "member" as const },
    context,
    afterCommit: [invitationMailHook],
  });
  if (!result.ok) throw result.error;
  return { owner, organizationId, context, invitation: result.value as InvitationDto };
};

describe("invitations (core member.invite + Better Auth acceptance)", () => {
  it("mails the link and lets the invitee accept with the invited role", async () => {
    const outbox = installFakeMail();
    const invitee = await signUp();
    const { organizationId, invitation } = await inviteAs({ invitee });
    expect(outbox).toHaveLength(1);
    expect(outbox[0]?.to).toBe(invitee.email);
    expect(outbox[0]?.text).toContain(`/accept-invitation/${invitation.id}`);
    await getAuth().api.acceptInvitation({
      headers: invitee.headers,
      body: { invitationId: invitation.id },
    });
    const member = await getDb().member.findFirstOrThrow({
      where: { organizationId, userId: invitee.userId },
    });
    expect(member.role).toBe("member");
  });

  it("makes a revoked invitation unusable", async () => {
    installFakeMail();
    const invitee = await signUp();
    const { context, invitation } = await inviteAs({ invitee });
    const revoked = await execute({
      operation: cancelInvitation,
      input: { id: invitation.id },
      context,
    });
    expect(revoked.ok).toBe(true);
    const accept = getAuth().api.acceptInvitation({
      headers: invitee.headers,
      body: { invitationId: invitation.id },
    });
    await expect(accept).rejects.toThrow();
  });

  it("closes Better Auth's own invite, cancel and remove endpoints, even to the owner", async () => {
    installFakeMail();
    const invitee = await signUp();
    const { owner, organizationId, invitation } = await inviteAs({ invitee });
    const api = getAuth().api;
    const invite = api.createInvitation({
      headers: owner.headers,
      body: { organizationId, email: "backdoor@example.test", role: "member" },
    });
    await expect(invite).rejects.toThrow(/not allowed/i);
    const cancel = api.cancelInvitation({
      headers: owner.headers,
      body: { invitationId: invitation.id },
    });
    await expect(cancel).rejects.toThrow(/not allowed/i);
    const staff = await signUp();
    await addMember({ organizationId, userId: staff.userId, role: "member" });
    const remove = api.removeMember({
      headers: owner.headers,
      body: { memberIdOrEmail: staff.email, organizationId },
    });
    await expect(remove).rejects.toThrow(/not allowed/i);
    expect(await getDb().member.count({ where: { organizationId } })).toBe(2);
    const row = await getDb().invitation.findUniqueOrThrow({ where: { id: invitation.id } });
    expect(row.status).toBe("pending");
  });
});
