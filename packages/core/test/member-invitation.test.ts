import { getDb } from "@bibi/db";
import { describe, expect, it } from "vitest";
import { cancelInvitation, execute, listInvitations } from "../src/index";
import { errorCode, testContext, unwrap } from "./helpers";
import { invite, withInviter } from "./invitation-helpers";
import { addTestMember } from "./org-helpers";

describe("member invitations (ADR 0004)", () => {
  it("invites with a fixed role, lists the pending invitation and audits it", async () => {
    const context = await withInviter();
    const invitation = unwrap({
      result: await invite({ context, email: "New.Person@Example.test", role: "member" }),
    });
    expect(invitation).toMatchObject({
      email: "new.person@example.test",
      role: "member",
      status: "pending",
      inviterId: context.actor.userId,
    });
    const row = await getDb().invitation.findUnique({ where: { id: invitation.id } });
    expect(row).toMatchObject({ role: "member", status: "pending" });
    const list = unwrap({
      result: await execute({ operation: listInvitations, input: {}, context }),
    });
    expect(list.items.map((item) => item.id)).toEqual([invitation.id]);
    const audit = await context.db.auditLog.findFirst({ where: { operation: "member.invite" } });
    expect(audit).toMatchObject({ entityType: "invitation", entityId: invitation.id });
  });

  it("refuses duplicates, existing members, unknown roles and escalation", async () => {
    const context = await withInviter();
    unwrap({ result: await invite({ context, email: "a@example.test", role: "member" }) });
    const again = await invite({ context, email: "A@example.test", role: "member" });
    expect(errorCode({ result: again })).toBe("CONFLICT");
    const memberId = await addTestMember({ context, role: "member" });
    const member = await getDb().member.findUniqueOrThrow({
      where: { id: memberId },
      include: { user: true },
    });
    const existing = await invite({ context, email: member.user.email, role: "member" });
    expect(errorCode({ result: existing })).toBe("CONFLICT");
    const unknown = await invite({ context, email: "b@example.test", role: "owner" as "admin" });
    expect(errorCode({ result: unknown })).toBe("VALIDATION");
    const asMember = { ...context, roles: ["manager"] };
    const escalate = await invite({ context: asMember, email: "c@example.test", role: "admin" });
    expect(errorCode({ result: escalate })).toBe("FORBIDDEN");
  });

  it("cancels a pending invitation once and audits before/after", async () => {
    const context = await withInviter();
    const { id } = unwrap({
      result: await invite({ context, email: "x@example.test", role: "member" }),
    });
    const cancelled = unwrap({
      result: await execute({ operation: cancelInvitation, input: { id }, context }),
    });
    expect(cancelled.status).toBe("canceled");
    const list = unwrap({
      result: await execute({ operation: listInvitations, input: {}, context }),
    });
    expect(list.items).toEqual([]);
    const twice = await execute({ operation: cancelInvitation, input: { id }, context });
    expect(errorCode({ result: twice })).toBe("NOT_FOUND");
    const audit = await context.db.auditLog.findFirst({
      where: { operation: "member.cancelInvitation" },
    });
    expect(audit?.before).toMatchObject({ status: "pending" });
    expect(audit?.after).toMatchObject({ status: "canceled" });
  });

  it("never reaches invitations of another organization", async () => {
    const context = await withInviter();
    const { id } = unwrap({
      result: await invite({ context, email: "y@example.test", role: "member" }),
    });
    const other = await withInviter();
    const list = unwrap({
      result: await execute({ operation: listInvitations, input: {}, context: other }),
    });
    expect(list.items).toEqual([]);
    const cancel = await execute({ operation: cancelInvitation, input: { id }, context: other });
    expect(errorCode({ result: cancel })).toBe("NOT_FOUND");
  });

  it("needs a signed-in inviter", async () => {
    const context = await withInviter();
    const system = testContext({
      organizationId: context.organizationId,
      actor: { type: "system", userId: null },
    });
    const result = await invite({ context: system, email: "z@example.test", role: "member" });
    expect(errorCode({ result })).toBe("FORBIDDEN");
  });
});
