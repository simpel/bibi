import type { OperationContext } from "../../operations/types";
import { namesMatch, normaliseCustomerName } from "./customer-name";
import { CUSTOMER_INCLUDE, type CustomerRow } from "./to-customer-dto";

/** Upper bound of rows read per match kind; the comparison in code runs on these only. */
const CANDIDATE_LIMIT = 200;
/** The longest words of a name that are searched for (two letters or more). */
const SEARCH_WORDS = 5;

type Db = { context: Pick<OperationContext, "db"> };

export type NameMatchesInput = Db & { name: string };

/**
 * Active customers whose normalised name equals the given one or contains it (or the other way
 * round). Postgres narrows to names containing one of the name's longest words; the normalised
 * comparison then runs on at most `CANDIDATE_LIMIT` rows.
 */
export async function nameMatches({ context, name }: NameMatchesInput): Promise<CustomerRow[]> {
  const core = normaliseCustomerName({ name });
  const words = [...new Set(core.split(" ").filter((word) => word.length >= 2))]
    .sort((a, b) => b.length - a.length || a.localeCompare(b))
    .slice(0, SEARCH_WORDS);
  if (words.length === 0) return [];
  const rows = await context.db.customer.findMany({
    where: {
      OR: words.map((word) => ({ name: { contains: word, mode: "insensitive" as const } })),
    },
    orderBy: [{ name: "asc" }, { id: "asc" }],
    take: CANDIDATE_LIMIT,
    include: CUSTOMER_INCLUDE,
  });
  return rows.filter((row) =>
    namesMatch({ a: core, b: normaliseCustomerName({ name: row.name }) }),
  );
}

export type DomainMatchesInput = Db & { domain: string };

/** Active customers with an active contact whose email is at the domain. */
export async function domainMatches({
  context,
  domain,
}: DomainMatchesInput): Promise<CustomerRow[]> {
  return context.db.customer.findMany({
    where: {
      contacts: {
        some: {
          status: "ACTIVE",
          email: { endsWith: `@${domain}`, mode: "insensitive" },
        },
      },
    },
    orderBy: [{ name: "asc" }, { id: "asc" }],
    take: CANDIDATE_LIMIT,
    include: CUSTOMER_INCLUDE,
  });
}
