import { conflict } from "../../shared/errors";

type ExpectedCountInput = { name: string; expected: number | undefined; actual: number };

/**
 * The approver saw `expected` bookings; if the count changed since, the cascade would archive
 * bookings they never saw, so the archive is refused (#144).
 */
export function checkExpectedBookingCount({ name, expected, actual }: ExpectedCountInput) {
  if (expected === undefined || expected === actual) return null;
  return conflict({
    message: `${name} now has ${actual} bookings that are not archived, not the ${expected} that were approved`,
    issues: [
      {
        path: "expectedBookingCount",
        message: `The booking count changed from ${expected} to ${actual}; review and try again`,
      },
    ],
  });
}
