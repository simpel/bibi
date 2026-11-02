import type { OperationContext } from "../../operations/types";
import { canView } from "../../shared/can-view";
import { findMatches, type Match } from "../customer/find-similar-operation";

/** The match to use: the only one, or one with more reasons than the next; else none. */
function clearWinner({ matches }: { matches: readonly Match[] }): string | null {
  const [first, second] = matches;
  if (!first) return null;
  if (!second || first.reasons.length > second.reasons.length) return first.row.id;
  return null;
}

export type ResolvePartyInput = {
  context: OperationContext;
  email: string | null;
  company: string | null;
};

export type Party = { customerId: string | null; contactId: string | null };

/**
 * The customer and contact a draft is for (ADR 0084 decision 3), the way `customer.findSimilar`
 * matches: the sender's email domain (public domains never match, ADR 0078), then the company
 * name. The contact is the customer's active contact with the sender's email. Ids are never
 * taken from the model, and nothing is resolved without `customer:read`.
 */
export async function resolveParty({ context, email, company }: ResolvePartyInput): Promise<Party> {
  if (!canView({ context, feature: "customer" })) return { customerId: null, contactId: null };
  const byDomain = email ? await findMatches({ context, email }) : [];
  let customerId = clearWinner({ matches: byDomain });
  if (!customerId && company) {
    customerId = clearWinner({
      matches: await findMatches({ context, name: company, email: email ?? undefined }),
    });
  }
  if (!customerId || !email) return { customerId, contactId: null };
  const contact = await context.db.contact.findFirst({
    where: { customerId, status: "ACTIVE", email: { equals: email.trim(), mode: "insensitive" } },
    select: { id: true },
  });
  return { customerId, contactId: contact?.id ?? null };
}
