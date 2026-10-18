import "server-only";
import { listCustomers, listMembers, listTicketTemplates, type Result } from "@okazi/core";
import { runOperation } from "@/server/run-operation";
import type { TemplateTicketFormData } from "./ui/template-ticket-form-data";

const LIMIT = 100;

/**
 * What the short create form picks from: predefined tickets, customers and (optionally, without
 * read access the list is empty) the members who can be assigned.
 */
export async function loadTemplateTicketData(): Promise<Result<TemplateTicketFormData>> {
  const [templates, customers, members] = await Promise.all([
    runOperation({ operation: listTicketTemplates, input: { limit: LIMIT } }),
    runOperation({ operation: listCustomers, input: { limit: LIMIT } }),
    runOperation({ operation: listMembers, input: { limit: LIMIT } }),
  ]);
  if (!templates.ok) return templates;
  if (!customers.ok) return customers;
  const named = ({ id, name }: { id: string; name: string }) => ({ id, name });
  return {
    ok: true,
    value: {
      templates: templates.value.items.map(named),
      customers: customers.value.items.map(named),
      members: members.ok
        ? members.value.items.map(({ userId, name }) => ({ id: userId, name }))
        : [],
    },
  };
}
