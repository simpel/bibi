import { describe, expect, it } from "vitest";
import {
  assignAssignment,
  changeTicketStatus,
  createTicket,
  execute,
  listAssignments,
  unfollowAssignment,
} from "../src/index";
import { assignTo, followAs, ticketSubject } from "./assignment-helpers";
import { errorCode, unwrap } from "./helpers";
import { testOrg } from "./org-helpers";
import { createTestTicket, memberUser, ticketSetup } from "./ticket-helpers";
import { statusByName } from "./ticket-status-helpers";

async function setup() {
  const { context, type, customer } = await ticketSetup();
  const ticket = await createTestTicket({
    context,
    entityTypeId: type.id,
    customerId: customer.id,
  });
  return { context, type, customer, ticket, subject: ticketSubject(ticket) };
}

describe("assignment.assign/follow/unfollow (ADR 0034)", () => {
  it("sets one assignee plus followers and audits every change", async () => {
    const { context, ticket, subject } = await setup();
    const erik = await memberUser({ context, name: "Erik Lund" });
    const johan = await memberUser({ context, name: "Johan Ek" });
    const assigned = await assignTo({ context, ...subject, assigneeId: johan });
    expect(assigned).toMatchObject({ ...subject, responsibilityId: null, assigneeId: johan });
    await followAs({ context, ...subject, userId: erik });
    const again = await followAs({ context, ...subject, userId: erik });
    expect(again.followers).toEqual([{ userId: erik, source: "EXPLICIT" }]);
    const unfollowed = unwrap({
      result: await execute({
        operation: unfollowAssignment,
        input: { ...subject, userId: erik },
        context,
      }),
    });
    expect(unfollowed.followers).toEqual([]);
    const list = unwrap({
      result: await execute({ operation: listAssignments, input: subject, context }),
    });
    expect(list.items).toHaveLength(1);
    const rows = await context.db.auditLog.findMany({
      where: { entityId: assigned.id },
      orderBy: { createdAt: "asc" },
    });
    // The second follow changes nothing but is still an audited command.
    expect(rows.map((row) => row.operation)).toEqual([
      "assignment.assign",
      "assignment.follow",
      "assignment.follow",
      "assignment.unfollow",
    ]);
    expect(rows[0]?.entityType).toBe("assignment");
    expect(ticket.id).toBe(assigned.subjectId);
  });

  it("refuses people who are not members, also on create", async () => {
    const { context, type, customer, subject } = await setup();
    const elsewhere = await memberUser({ context: await testOrg(), name: "Outsider" });
    const assign = await execute({
      operation: assignAssignment,
      input: { ...subject, assigneeId: elsewhere },
      context,
    });
    expect(assign.ok ? null : assign.error.issues[0]?.path).toBe("assigneeId");
    const create = await execute({
      operation: createTicket,
      input: {
        entityTypeId: type.id,
        customerId: customer.id,
        assigneeId: "user_unknown",
      },
      context,
    });
    expect(create.ok ? null : create.error.issues[0]?.path).toBe("assigneeId");
  });

  it("refuses subjects of another organization and responsibilities off a ticket", async () => {
    const { context, subject } = await setup();
    const other = await testOrg();
    const johan = await memberUser({ context: other, name: "Johan Ek" });
    const foreign = await execute({
      operation: assignAssignment,
      input: { ...subject, assigneeId: johan },
      context: other,
    });
    expect(errorCode({ result: foreign })).toBe("NOT_FOUND");
    const read = await execute({ operation: listAssignments, input: subject, context: other });
    expect(errorCode({ result: read })).toBe("NOT_FOUND");
    const item = await execute({
      operation: assignAssignment,
      input: { subjectType: "ITEM", subjectId: "nope", assigneeId: null },
      context,
    });
    expect(errorCode({ result: item })).toBe("NOT_FOUND");
  });

  it("refuses a record of another base and keeps rows in the record's organization", async () => {
    const { context, customer, ticket } = await setup();
    const input = { subjectType: "TICKET" as const, subjectId: customer.id, assigneeId: null };
    const wrongBase = await execute({ operation: assignAssignment, input, context });
    expect(errorCode({ result: wrongBase })).toBe("NOT_FOUND");
    const other = await testOrg();
    const data = { organizationId: other.organizationId, recordId: ticket.id };
    await expect(other.db.assignment.create({ data })).rejects.toThrow();
  });

  it("needs a main assignee to move along an ASSIGNEE gate, and may remove it after", async () => {
    const { context, ticket, subject } = await setup();
    const confirmed = await statusByName({ context, name: "Confirmed" });
    const move = { ticketId: ticket.id, statusId: confirmed.id };
    const refused = await execute({ operation: changeTicketStatus, input: move, context });
    expect(errorCode({ result: refused })).toBe("CONFLICT");
    const johan = await memberUser({ context, name: "Johan Ek" });
    await assignTo({ context, ...subject, assigneeId: johan });
    unwrap({ result: await execute({ operation: changeTicketStatus, input: move, context }) });
    // A gate runs only on a move (ADR 0067 §5): the assignee can go once the ticket is there.
    const removed = await execute({
      operation: assignAssignment,
      input: { ...subject, assigneeId: null },
      context,
    });
    expect(removed.ok).toBe(true);
    const maria = await memberUser({ context, name: "Maria Holm" });
    const replaced = await assignTo({ context, ...subject, assigneeId: maria });
    expect(replaced.assigneeId).toBe(maria);
  });
});
