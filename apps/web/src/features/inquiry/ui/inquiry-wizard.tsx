"use client";

import { useTranslations } from "next-intl";
import { TypedWizard } from "@/components/wizard/typed-wizard";
import { ROUTES } from "@/lib/routes";
import { InquiryCoreFields } from "./inquiry-core-fields";
import type { InquiryFormData } from "./inquiry-form-data";
import { useInquiryForm } from "./use-inquiry-form";

export type InquiryWizardProps = { data: InquiryFormData };

/** Create an inquiry step by step: type, customer and wishes, then the type's own fields. */
export function InquiryWizard({ data }: InquiryWizardProps) {
  const t = useTranslations("inquiry.fields");
  const { form, run, pending, typeOf } = useInquiryForm({ data, onDone: () => undefined });
  return (
    <TypedWizard
      form={form}
      data={data}
      typeOf={typeOf}
      run={run}
      pending={pending}
      core={<InquiryCoreFields form={form} customers={data.customers} contacts={data.contacts} />}
      coreFields={[
        "customerId",
        "contactId",
        "desiredStartsAt",
        "desiredEndsAt",
        "quantity",
        "budget",
      ]}
      typeLabel={t("type")}
      typeChosen={false}
      cancelHref={ROUTES.inquiries}
    />
  );
}
