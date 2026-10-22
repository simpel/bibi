"use client";

import type { CustomerDto } from "@bibi/core";
import type { TypedFormData } from "@/components/typed-fields/typed-form-data";
import { useRouter } from "@/lib/navigation";
import { customerRoute } from "@/lib/routes";
import { CustomerForm } from "./customer-form";

export type CustomerUpdateFormProps = { customer: CustomerDto; data: TypedFormData };

/** The customer form on its update page; saving (or cancelling) goes back to the customer. */
export function CustomerUpdateForm({ customer, data }: CustomerUpdateFormProps) {
  const router = useRouter();
  return (
    <div className="max-w-2xl">
      <CustomerForm
        data={data}
        customer={customer}
        onDone={() => router.push(customerRoute({ id: customer.id }))}
      />
    </div>
  );
}
