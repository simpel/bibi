"use client";

import { useTranslations } from "next-intl";
import { TypedWizard } from "@/components/wizard/typed-wizard";
import { ROUTES } from "@/lib/routes";
import { TicketCoreFields } from "./ticket-core-fields";
import type { TicketFormData } from "./ticket-form-data";
import { useTicketForm } from "./use-ticket-form";

export type TicketWizardProps = { data: TicketFormData };

/** Create a ticket step by step: type, customer and details, then the type's own fields. */
export function TicketWizard({ data }: TicketWizardProps) {
  const t = useTranslations("ticket.fields");
  const { form, run, pending, typeOf } = useTicketForm({ data, onDone: () => undefined });
  return (
    <TypedWizard
      form={form}
      data={data}
      typeOf={typeOf}
      run={run}
      pending={pending}
      core={<TicketCoreFields form={form} data={data} />}
      coreFields={[
        "customerId",
        "contactId",
        "desiredStartsAt",
        "desiredEndsAt",
        "estimatedHeadcount",
        "guaranteedHeadcount",
        "budget",
      ]}
      typeLabel={t("type")}
      typeChosen={false}
      cancelHref={ROUTES.tickets}
    />
  );
}
