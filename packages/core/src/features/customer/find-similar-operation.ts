import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import type { OperationContext } from "../../operations/types";
import { emailDomainOf } from "../../organization/email-domain";
import {
  CustomerFindSimilarInputSchema,
  CustomerFindSimilarOutputSchema,
  type SimilarCustomer,
  type SimilarReason,
} from "./find-similar-schema";
import { domainMatches, nameMatches } from "./similar-candidates";
import { type CustomerRow, toCustomerDto } from "./to-customer-dto";

/** The most suggestions returned; staff pick one or confirm the new customer. */
const MAX_SUGGESTIONS = 5;

export type Match = { row: CustomerRow; reasons: SimilarReason[] };

type MergeInput = { byName: readonly CustomerRow[]; byDomain: readonly CustomerRow[] };

/** One entry per customer with every reason it matched for. */
function mergeMatches({ byName, byDomain }: MergeInput): Match[] {
  const matches = new Map<string, Match>();
  const add = ({ row, reason }: { row: CustomerRow; reason: SimilarReason }) => {
    const match = matches.get(row.id) ?? { row, reasons: [] };
    match.reasons.push(reason);
    matches.set(row.id, match);
  };
  for (const row of byName) add({ row, reason: "NAME" });
  for (const row of byDomain) add({ row, reason: "EMAIL_DOMAIN" });
  return [...matches.values()];
}

/** Both reasons first, then by name and id, so the order is deterministic. */
function strongestFirst({ matches }: { matches: Match[] }): Match[] {
  return [...matches].sort(
    (a, b) =>
      b.reasons.length - a.reasons.length ||
      a.row.name.localeCompare(b.row.name) ||
      a.row.id.localeCompare(b.row.id),
  );
}

type Ctx = { context: OperationContext };

/** Active customers matching a name or a non-public email domain, strongest first (at most 5). */
export async function findMatches({
  context,
  name,
  email,
}: Ctx & { name?: string | undefined; email?: string | undefined }) {
  const domain = email ? emailDomainOf({ email }) : null;
  const [byName, byDomain] = await Promise.all([
    name ? nameMatches({ context, name }) : [],
    domain ? domainMatches({ context, domain }) : [],
  ]);
  const matches = mergeMatches({ byName, byDomain });
  return strongestFirst({ matches }).slice(0, MAX_SUGGESTIONS);
}

export const findSimilarCustomers = defineOperation({
  name: "customer.findSimilar",
  kind: "query",
  description:
    "Before creating a customer: find active customers that may be the same one (ADR 0081). " +
    "Matches a normalised name (case, punctuation and legal forms such as AB or Ltd ignored; " +
    "equal, or one contains the other) and contacts whose email shares the given email's " +
    "domain (public mail domains such as gmail.com never match). At most 5 suggestions.",
  input: CustomerFindSimilarInputSchema,
  output: CustomerFindSimilarOutputSchema,
  permission: "customer:read",
  handler: async ({ input, context }) => {
    const matches = await findMatches({ context, name: input.name, email: input.email });
    const items: SimilarCustomer[] = matches.map(({ row, reasons }) => ({
      customer: toCustomerDto({ row, context }),
      reasons,
    }));
    return ok({ value: { items } });
  },
});
