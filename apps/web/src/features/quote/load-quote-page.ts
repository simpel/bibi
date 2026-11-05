import "server-only";
import {
  getQuote,
  listAssignments,
  listMembers,
  listQuotes,
  type QuoteDto,
  type Result,
} from "@bibi/core";
import { cache } from "react";
import type { PersonOption } from "@/components/people/person-name";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { runOperation } from "@/server/run-operation";
import { quoteAbilities } from "./ui/quote-abilities";
import type { QuoteAbilities } from "./ui/quote-actions";

export type QuotePageData = {
  quote: QuoteDto;
  /** Every version of the order's quote, newest first. */
  versions: QuoteDto[];
  /** The order's salesperson: a quote has no owner of its own (ADR 0034). */
  ownerId: string | null;
  /** With their email, for the sales owner's contact card. */
  members: PersonOption[];
  can: QuoteAbilities;
};

const loadQuotePageCached = cache(async (id: string): Promise<Result<QuotePageData>> => {
  // The member list does not depend on the quote, so it runs beside it.
  const [loaded, members] = await Promise.all([
    runOperation({ operation: getQuote, input: { id } }),
    runOperation({ operation: listMembers, input: { limit: 100 } }),
  ]);
  if (!loaded.ok) return loaded;
  const quote = loaded.value;
  const [versions, assignments, abilities] = await Promise.all([
    runOperation({ operation: listQuotes, input: { orderId: quote.orderId, limit: 100 } }),
    runOperation({
      operation: listAssignments,
      input: { subjectType: "ORDER", subjectId: quote.orderId },
    }),
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
      members: people.map(({ userId, name, email }) => ({ id: userId, name, email })),
      can: quoteAbilities({
        quote,
        latestVersion,
        canEdit: can({ abilities, permission: "quote:write" }),
        canSend: can({ abilities, permission: "quote:write" }),
      }),
    },
  };
});

/** The quote, its sibling versions and the order's salesperson, read once per request. */
export function loadQuotePage({ id }: { id: string }): Promise<Result<QuotePageData>> {
  return loadQuotePageCached(id);
}
