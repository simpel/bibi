"use client";

import { useTranslations } from "next-intl";
import { TypedWizard } from "@/components/wizard/typed-wizard";
import { ROUTES } from "@/lib/routes";
import { BookingCoreFields } from "./booking-core-fields";
import type { BookingFormData } from "./booking-form-data";
import { useBookingForm } from "./use-booking-form";

export type BookingWizardProps = { data: BookingFormData };

/** Create a booking step by step: type, customer and time, then the type's own fields. */
export function BookingWizard({ data }: BookingWizardProps) {
  const t = useTranslations("booking.fields");
  const { form, run, pending, typeOf } = useBookingForm({ data, onDone: () => undefined });
  return (
    <TypedWizard
      form={form}
      data={data}
      typeOf={typeOf}
      run={run}
      pending={pending}
      core={<BookingCoreFields form={form} customers={data.customers} />}
      coreFields={["customerId", "startsAt", "endsAt", "estimatedHeadcount", "guaranteedHeadcount"]}
      typeLabel={t("type")}
      typeChosen={false}
      cancelHref={ROUTES.bookings}
    />
  );
}
