import type { RecordBase } from "@bibi/db";
import { defineReconciliation, type ReconcileContext } from "./reconcile";

type MirrorRow = {
  id: string;
  base: RecordBase;
  entityTypeId: string;
  status: string;
  fields: string;
};

const ALL = { status: { in: ["ACTIVE" as const, "ARCHIVED" as const] } };
const COLUMNS = { id: true, entityTypeId: true, status: true, fields: true } as const;

type Row = { id: string; entityTypeId: string; status: string; fields: unknown };

const mirror = ({ base, rows }: { base: RecordBase; rows: Row[] }): MirrorRow[] =>
  rows.map((row) => ({ ...row, base, fields: JSON.stringify(row.fields) }));

/** What the `Record` supertable should hold (ADR 0056): one row per row of the seven tables. */
async function rebuildRecords({ context: { db } }: ReconcileContext): Promise<MirrorRow[]> {
  const query = { where: ALL, select: COLUMNS };
  return [
    ...mirror({ base: "ITEM", rows: await db.item.findMany(query) }),
    ...mirror({ base: "CUSTOMER", rows: await db.customer.findMany(query) }),
    ...mirror({ base: "CONTACT", rows: await db.contact.findMany(query) }),
    ...mirror({ base: "TICKET", rows: await db.ticket.findMany(query) }),
    ...mirror({ base: "TICKET_TEMPLATE", rows: await db.ticketTemplate.findMany(query) }),
    ...mirror({ base: "LINE", rows: await db.line.findMany(query) }),
    ...mirror({ base: "REQUIREMENT", rows: await db.requirement.findMany(query) }),
  ];
}

const differs = ({ have, want }: { have: MirrorRow; want: MirrorRow }) =>
  have.base !== want.base ||
  have.entityTypeId !== want.entityTypeId ||
  have.status !== want.status ||
  have.fields !== want.fields;

/** The `Record` rows against the rows that extend them: same base, type, status and fields. */
export const recordReconciliation = defineReconciliation({
  name: "records",
  rebuild: rebuildRecords,
  compare: async ({ context, rebuilt }) => {
    const stored = await context.db.record.findMany({
      where: ALL,
      select: { ...COLUMNS, base: true },
    });
    const byId = new Map(
      stored.map((row) => [row.id, { ...row, fields: JSON.stringify(row.fields) }]),
    );
    const differing: string[] = [];
    for (const want of rebuilt) {
      const have = byId.get(want.id);
      byId.delete(want.id);
      if (!have) differing.push(`${want.base} ${want.id} has no record row`);
      else if (differs({ have, want }))
        differing.push(`record row of ${want.base} ${want.id} differs`);
    }
    for (const [id, row] of byId) differing.push(`record row ${row.base} ${id} extends nothing`);
    return differing;
  },
});
