import "server-only";
import { getContact, getCustomer, listAssignments, listMembers, type TicketDto } from "@bibi/core";
import { runOperation } from "@/server/run-operation";

const LIMIT = 100;

/** The ticket's people: none where the caller may not read them (ADR 0050). */
export type TicketSheetFacts = {
  assignee: SheetPerson | null;
  customer: { id: string; name: string } | null;
  contact: SheetPerson | null;
};

/** A person with the ways to reach them, for their contact card. */
export type SheetPerson = { name: string; email: string | null; phone?: string | null };

/** The main assignee (`assignment.list`, then the member's name and email). */
async function loadAssignee({ ticketId }: { ticketId: string }) {
  const input = { subjectType: "TICKET" as const, subjectId: ticketId };
  const assignments = await runOperation({ operation: listAssignments, input });
  if (!assignments.ok) return null;
  const main = assignments.value.items.find(({ responsibilityId }) => responsibilityId === null);
  if (!main?.assigneeId) return null;
  const members = await runOperation({ operation: listMembers, input: { limit: LIMIT } });
  if (!members.ok) return null;
  const member = members.value.items.find(({ userId }) => userId === main.assigneeId);
  return member ? { name: member.name, email: member.email } : null;
}

/** Who answers for the ticket, who it is for and who to talk to there. */
export async function loadSheetFacts({ ticket }: { ticket: TicketDto }): Promise<TicketSheetFacts> {
  const { customerId, contactId } = ticket;
  const [assignee, customer, contact] = await Promise.all([
    loadAssignee({ ticketId: ticket.id }),
    runOperation({ operation: getCustomer, input: { id: customerId } }),
    contactId ? runOperation({ operation: getContact, input: { id: contactId } }) : null,
  ]);
  return {
    assignee,
    customer: customer.ok ? { id: customer.value.id, name: customer.value.name } : null,
    contact: contact?.ok
      ? { name: contact.value.name, email: contact.value.email, phone: contact.value.phone }
      : null,
  };
}
