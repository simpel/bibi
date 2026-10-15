import type { Customer } from "@okazi/db";
import type { OperationContext } from "../../operations/types";
import { asFieldValues } from "../field-definition/field-usage";
import type { CustomerDto } from "./schema";

export type ToCustomerDtoInput = { row: Customer };

export const toCustomerDto = ({ row }: ToCustomerDtoInput): CustomerDto => ({
  ...row,
  fields: asFieldValues({ value: row.fields }),
});

export type LoadCustomerInput = { context: Pick<OperationContext, "db">; id: string };

/** The active customer, or null when missing, archived or in another organization. */
export async function loadCustomer({
  context,
  id,
}: LoadCustomerInput): Promise<CustomerDto | null> {
  const row = await context.db.customer.findFirst({ where: { id } });
  return row ? toCustomerDto({ row }) : null;
}
