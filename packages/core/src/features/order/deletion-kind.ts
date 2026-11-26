import { allBlockers, countBlocker } from "../../archive/blockers";
import {
  archivedRows,
  archivedWhere,
  EITHER_STATUS,
  type KindInput,
  type LifecycleKind,
  lifecycleRow,
} from "../../archive/lifecycle-kind";
import { removeOrder } from "./deletion-remove";
import { orderRestoreBlockers, reviveOrderContent } from "./deletion-restore";

/**
 * Money and what the customer saw are never deleted (ADR 0118): payments (and their refunds),
 * deposits, invoices (and their credit notes) and quotes past draft (an accepted quote, or a
 * sent one with the order version it was sent as). A task linked to the order also keeps it.
 */
const deleteBlockers = ({ context, id }: KindInput) => {
  const { db } = context;
  const where = { orderId: id };
  return allBlockers({
    checks: [
      countBlocker({
        count: Promise.all([db.payment.count({ where }), db.deposit.count({ where })]).then(
          ([payments, deposits]) => payments + deposits,
        ),
        ...{ feature: "payment", path: "payments", what: "payments or deposits" },
      }),
      countBlocker({
        count: db.invoice.count({ where }),
        ...{ feature: "payment", path: "invoices", what: "invoices" },
      }),
      countBlocker({
        count: db.quote.count({
          where: { ...where, status: EITHER_STATUS, quoteStatus: { not: "DRAFT" } },
        }),
        ...{ feature: "quote", path: "quotes", what: "sent or accepted quotes" },
      }),
      countBlocker({
        count: db.task.count({ where: { ...where, status: EITHER_STATUS } }),
        ...{ feature: "task", path: "tasks", what: "tasks" },
      }),
      countBlocker({
        count: db.reservation.count({ where: { ...where, status: EITHER_STATUS } }),
        ...{ feature: "reservation", path: "reservations", what: "table reservations" },
      }),
    ],
  });
};

/**
 * Orders (ADR 0118): an order without money or sent quotes is deleted with everything it has;
 * one with them stays archived. Restored with the lines, groups and requirements archived with
 * it, while its customer, contact, type and status are active.
 */
export const orderKind: LifecycleKind = {
  entityType: "order",
  label: "Order",
  record: true,
  find: async ({ context, id }) =>
    lifecycleRow({
      row: await context.db.order.findFirst({ where: { id, status: EITHER_STATUS } }),
    }),
  restoreBlockers: orderRestoreBlockers,
  // `archivedAt` stays until the content archived with it is back (`reviveOrderContent`).
  reactivate: async ({ context, id }) => {
    await context.db.order.update({
      where: { id, status: "ARCHIVED" },
      data: { status: "ACTIVE" },
    });
  },
  afterRestore: reviveOrderContent,
  deleteBlockers,
  remove: removeOrder,
  archived: ({ context, before }) =>
    archivedRows({
      rows: context.db.order
        .findMany({
          where: archivedWhere({ before }),
          select: { id: true, archivedAt: true, reference: true, title: true },
          orderBy: { archivedAt: "asc" },
        })
        .then((rows) =>
          rows.map(({ id, archivedAt, reference, title }) => ({
            id,
            archivedAt,
            name: title ? `#${reference} ${title}` : `#${reference}`,
          })),
        ),
    }),
};
