"use client";

import { Button, Form } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { TextField } from "@/components/form/text-field";
import { useDepositForm } from "./use-deposit-form";

export type DepositFormProps = { ticketId: string };

/** Description, fixed amount and due date of a new deposit request (`deposit.create`). */
export function DepositForm({ ticketId }: DepositFormProps) {
  const t = useTranslations("deposit");
  const { form, submit, pending } = useDepositForm({ ticketId });
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid max-w-lg gap-4">
        <TextField form={form} name="description" label={t("fields.description")} required />
        <TextField
          form={form}
          name="amount"
          label={t("fields.amount")}
          type="number"
          step="0.01"
          required
        />
        <TextField form={form} name="dueDate" label={t("fields.dueDate")} type="date" />
        <div>
          <Button type="submit" disabled={pending}>
            {t("create")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
