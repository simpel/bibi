import { namesMatch, normaliseCustomerName } from "../../features/customer/customer-name";
import { findSimilarCustomers } from "../../features/customer/find-similar-operation";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import type { DemoOrg } from "./types";

/** What staff type for a new customer that already exists as Nordkust Logistik. */
const PROBE = { name: "NORDKUST LOGISTIK", email: "ny.kontakt@nordkust.test" };

export type CheckDemoSimilarInput = { context: ExecuteContext; org: DemoOrg };

type Ctx = CheckDemoSimilarInput;

/** The org's customers the probe should find by name, from the data files. */
const expectedNames = ({ org }: Pick<Ctx, "org">) => {
  const probe = normaliseCustomerName({ name: PROBE.name });
  return org.customers
    .filter((customer) => namesMatch({ a: probe, b: normaliseCustomerName(customer) }))
    .map((customer) => customer.name)
    .sort();
};

/**
 * ADR 0081: `customer.findSimilar` suggests every Nordkust Logistik customer for a new one with
 * that name and a nordkust.test email, both by name and domain, and nothing for a public domain.
 * Organizations without such a customer skip it.
 */
export async function checkDemoSimilarCustomers({ context, org }: Ctx): Promise<string[]> {
  const expected = expectedNames({ org });
  if (expected.length === 0) return [];
  const found = await execute({ operation: findSimilarCustomers, input: PROBE, context });
  if (!found.ok) return [`${org.slug}: customer.findSimilar failed: ${found.error.message}`];
  const failures: string[] = [];
  const names = found.value.items.map((item) => item.customer.name).sort();
  if (names.join("|") !== expected.join("|")) {
    failures.push(`${org.slug}: findSimilar found ${names.join(", ")}, expected ${expected}`);
  }
  if (found.value.items.some((item) => item.reasons.length !== 2)) {
    failures.push(`${org.slug}: findSimilar did not match Nordkust by both name and domain`);
  }
  const input = { email: "someone@gmail.com" };
  const publicDomain = await execute({ operation: findSimilarCustomers, input, context });
  if (!publicDomain.ok || publicDomain.value.items.length > 0) {
    failures.push(`${org.slug}: findSimilar matched a public mail domain`);
  }
  return failures;
}
