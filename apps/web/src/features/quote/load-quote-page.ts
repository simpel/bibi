import "server-only";
import {
  getQuote,
  listAssignments,
  listMembers,
  listQuotes,
  type QuoteDto,
  type Result,
} from "@bibi/core";
import type { NamedOption } from "@/components/form/named-option";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { runOperation } from "@/server/run-operation";
import { quoteAbilities } from "./ui/quote-abilities";
import type { QuoteAbilities } from "./ui/quote-actions";

export type QuotePageData = {
  quote: QuoteDto;
  /** Every version of the ticket's quote, newest first. */
  versions: QuoteDto[];
  /** The ticket's salesperson: a quote has no owner of its own (ADR 0034). */
  ownerId: string | null;
  members: NamedOption[];
  can: QuoteAbilities;
};

/** The quote, its sibling versions and the ticket's salesperson. */
export async function loadQuotePage({ id }: { id: string }): Promise<Result<QuotePageData>> {
  const loaded = await runOperation({ operation: getQuote, input: { id } });
  if (!loaded.ok) return loaded;
  const quote = loaded.value;
  const [versions, assignments, members, abilities] = await Promise.all([
    runOperation({ operation: listQuotes, input: { ticketId: quote.ticketId, limit: 100 } }),
    runOperation({
      operation: listAssignments,
      input: { subjectType: "TICKET", subjectId: quote.ticketId },
    }),
    runOperation({ operation: listMembers, input: { limit: 100 } }),
    getCallerAbilities(),
  ]);
  const siblings = versions.ok ? versions.value.items : [quote];
  const latestVersion = Math.max(...siblings.map((version) => version.version));
  const main = assignments.ok
    ? assignments.value.items.find((assignment) => assignment.responsibilityId === null)
    : undefined;
  const people = members.ok ? members.value.items : [];
  return {
    ok: true,
    value: {
      quote,
      versions: siblings,
      ownerId: main?.assigneeId ?? null,
      members: people.map(({ userId, name }) => ({ id: userId, name })),
      can: quoteAbilities({
        quote,
        latestVersion,
        canEdit: can({ abilities, permission: "quote:write" }),
        canSend: can({ abilities, permission: "quote:write" }),
      }),
    },
  };
}
