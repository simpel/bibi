import { conflict } from "../../shared/errors";

type ExpectedCountInput = { name: string; expected: number | undefined; actual: number };

/**
 * The approver saw `expected` orders; if the count changed since, the cascade would archive
 * orders they never saw, so the archive is refused (#144).
 */
export function checkExpectedOrderCount({ name, expected, actual }: ExpectedCountInput) {
  if (expected === undefined || expected === actual) return null;
  return conflict({
    message: `${name} now has ${actual} orders that are not archived, not the ${expected} that were approved`,
    issues: [
      {
        path: "expectedOrderCount",
        message: `The order count changed from ${expected} to ${actual}; review and try again`,
      },
    ],
  });
}
