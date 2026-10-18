import { conflict } from "../../shared/errors";

type ExpectedCountInput = { name: string; expected: number | undefined; actual: number };

/**
 * The approver saw `expected` tickets; if the count changed since, the cascade would archive
 * tickets they never saw, so the archive is refused (#144).
 */
export function checkExpectedTicketCount({ name, expected, actual }: ExpectedCountInput) {
  if (expected === undefined || expected === actual) return null;
  return conflict({
    message: `${name} now has ${actual} tickets that are not archived, not the ${expected} that were approved`,
    issues: [
      {
        path: "expectedTicketCount",
        message: `The ticket count changed from ${expected} to ${actual}; review and try again`,
      },
    ],
  });
}
