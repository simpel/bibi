import type { DemoTicket } from "./ticket-types";

/** "Hisingen Energi AB" → "Hisingen Energi": a title names the customer as staff say it. */
const spoken = ({ customer }: { customer: string }) => customer.replace(/ (AB|KB|HB)$/, "");

/** "Sales kickoff" → "sales kickoff", to follow the customer's name. */
const lower = ({ what }: { what: string }) => what.charAt(0).toLowerCase() + what.slice(1);

export type TitleForInput = { customer: string; what: string };

/** The customer and what it is: "Hisingen Energi sales kickoff". */
export const titleFor = ({ customer, what }: TitleForInput) =>
  `${spoken({ customer })} ${lower({ what })}`;

/**
 * The demo ticket's title as staff would write it: its own (the data files name each ticket),
 * else the customer and what it is ("Hisingen Energi sales kickoff"). The seed names every ticket
 * itself, so it never waits for a model.
 */
export function demoTitle({ ticket }: { ticket: DemoTicket }): string {
  if (ticket.title) return ticket.title;
  const purpose = ticket.fields?.Purpose;
  const what = typeof purpose === "string" ? purpose : ticket.type;
  return titleFor({ customer: ticket.customer, what });
}
