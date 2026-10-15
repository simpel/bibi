import type { CustomerDto, EntityTypeDto } from "@okazi/core";
import { type RawFieldValue, rawFields } from "@/components/typed-fields/raw-fields";

/** Raw values of the customer form: inputs are strings; the credit limit in kr. */
export type CustomerFormValues = {
  entityTypeId: string;
  name: string;
  email: string;
  phone: string;
  invoiceStreetAddress: string;
  invoicePostalCode: string;
  invoiceCity: string;
  invoiceCountry: string;
  paymentTermsDays: string;
  creditLimit: string;
  fields: Record<string, RawFieldValue>;
};

export type CustomerDefaultsInput = {
  type: EntityTypeDto | undefined;
  customer?: CustomerDto | undefined;
};

const text = ({ value }: { value: number | string | null | undefined }) =>
  value === null || value === undefined ? "" : String(value);

export function customerFormDefaults({
  type,
  customer,
}: CustomerDefaultsInput): CustomerFormValues {
  return {
    entityTypeId: type?.id ?? "",
    name: customer?.name ?? "",
    email: text({ value: customer?.email }),
    phone: text({ value: customer?.phone }),
    invoiceStreetAddress: text({ value: customer?.invoiceStreetAddress }),
    invoicePostalCode: text({ value: customer?.invoicePostalCode }),
    invoiceCity: text({ value: customer?.invoiceCity }),
    invoiceCountry: customer?.invoiceCountry ?? "SE",
    paymentTermsDays: text({ value: customer?.paymentTermsDays }),
    creditLimit: customer?.creditLimitMinor == null ? "" : String(customer.creditLimitMinor / 100),
    fields: rawFields({ type, stored: customer?.fields ?? {} }),
  };
}
