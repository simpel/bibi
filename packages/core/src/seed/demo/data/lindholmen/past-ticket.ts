import type { DemoInvoice, DemoLine, DemoTicket } from "../../ticket-types";

export const lunch: DemoLine = {
  item: "Conference lunch",
  name: "Lunch",
  from: "12:00",
  to: "13:00",
};
export const coffee: DemoLine = {
  item: "Coffee and tea",
  name: "Coffee",
  from: "10:00",
  to: "10:30",
};
export const dinner: DemoLine = {
  item: "Three-course dinner",
  name: "Dinner",
  from: "19:00",
  to: "22:00",
};
export const buffet: DemoLine = {
  item: "Reception buffet",
  name: "Buffet",
  from: "18:00",
  to: "20:00",
};
export const room = ({ item }: { item: string }): DemoLine => ({
  item,
  name: "Meeting room",
  quantity: 1,
  from: "09:00",
  to: "17:00",
});

type PastInput = Pick<DemoTicket, "ref" | "customer" | "type" | "day" | "headcount" | "lines"> &
  Pick<DemoInvoice, "paidDay" | "refund"> & { dueAfter?: number };

/**
 * A Completed past event, invoiced two days later with 30 days to pay (`dueAfter` overrides):
 * paid on `paidDay` when set, otherwise open.
 */
export const past = ({
  day,
  paidDay,
  refund,
  dueAfter = 30,
  ...ticket
}: PastInput): DemoTicket => ({
  ...ticket,
  day,
  from: "09:00",
  to: "22:00",
  status: "Completed",
  // Completed requires an assignee; as on L1 and L2.
  assignee: ticket.type === "Event" ? "Maria Holm" : "Johan Ek",
  money: {
    invoice: {
      paid: paidDay !== undefined,
      sentDay: day + 2,
      dueDay: day + 2 + dueAfter,
      ...(paidDay === undefined ? {} : { paidDay }),
      ...(refund ? { refund } : {}),
    },
  },
});
