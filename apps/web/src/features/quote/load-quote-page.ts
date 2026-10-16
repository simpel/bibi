import "server-only";
import {
  getInquiry,
  getQuote,
  listMembers,
  listQuotes,
  type QuoteDto,
  type Result,
} from "@okazi/core";
import type { NamedOption } from "@/components/form/named-option";
import { getCallerAbilities } from "@/server/caller-abilities";
import { runOperation } from "@/server/run-operation";
import { loadQuoteItems } from "./load-quote-items";
import { quoteAbilities } from "./ui/quote-abilities";
import type { QuoteAbilities } from "./ui/quote-actions";

export type QuotePageData = {
  quote: QuoteDto;
  /** Every version of the inquiry's quote, newest first. */
  versions: QuoteDto[];
  /** The inquiry's salesperson: a quote has no owner of its own (ADR 0034). */
  ownerId: string | null;
  members: NamedOption[];
  items: NamedOption[];
  can: QuoteAbilities;
};

/** The quote, its sibling versions, the inquiry's salesperson and the items to pick. */
export async function loadQuotePage({ id }: { id: string }): Promise<Result<QuotePageData>> {
  const loaded = await runOperation({ operation: getQuote, input: { id } });
  if (!loaded.ok) return loaded;
  const quote = loaded.value;
  const [versions, inquiry, members, items, { quoteWrite }] = await Promise.all([
    runOperation({ operation: listQuotes, input: { inquiryId: quote.inquiryId, limit: 100 } }),
    runOperation({ operation: getInquiry, input: { id: quote.inquiryId } }),
    runOperation({ operation: listMembers, input: { limit: 100 } }),
    loadQuoteItems(),
    getCallerAbilities(),
  ]);
  const siblings = versions.ok ? versions.value.items : [quote];
  const latestVersion = Math.max(...siblings.map((version) => version.version));
  const people = members.ok ? members.value.items : [];
  return {
    ok: true,
    value: {
      quote,
      versions: siblings,
      ownerId: inquiry.ok ? inquiry.value.salesOwnerId : null,
      members: people.map(({ userId, name }) => ({ id: userId, name })),
      items,
      can: quoteAbilities({ quote, latestVersion, canWrite: quoteWrite }),
    },
  };
}
