import { getDb } from "@bibi/db";

export type ArchiveContactsOfInput = { customerId: string };

/**
 * Archives every contact of the customer directly. Test setup only: the contact a ticket needs
 * (ADR 0081) would otherwise block `customer.archive`, which is not what these tests are about.
 */
export async function archiveContactsOf({ customerId }: ArchiveContactsOfInput): Promise<void> {
  await getDb().contact.updateMany({ where: { customerId }, data: { status: "ARCHIVED" } });
}
