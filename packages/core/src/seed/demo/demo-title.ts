import type { DemoOrder } from "./order-types";

/** "Hisingen Energi AB" → "Hisingen Energi": a title names the customer as staff say it. */
const spoken = ({ customer }: { customer: string }) => customer.replace(/ (AB|KB|HB)$/, "");

/** "Sales kickoff" → "sales kickoff", to follow the customer's name. */
const lower = ({ what }: { what: string }) => what.charAt(0).toLowerCase() + what.slice(1);

export type TitleForInput = { customer: string; what: string };

/** The customer and what it is: "Hisingen Energi sales kickoff". */
export const titleFor = ({ customer, what }: TitleForInput) =>
  `${spoken({ customer })} ${lower({ what })}`;

/**
 * The demo order's title as staff would write it: its own (the data files name each order),
 * else the customer and what it is ("Hisingen Energi sales kickoff"). The seed names every order
 * itself, so it never waits for a model.
 */
export function demoTitle({ order }: { order: DemoOrder }): string {
  if (order.title) return order.title;
  const purpose = order.fields?.Purpose;
  const what = typeof purpose === "string" ? purpose : order.type;
  return titleFor({ customer: order.customer, what });
}
