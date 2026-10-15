import type { BookingDto } from "@okazi/core";
import { getFormatter, getTranslations } from "next-intl/server";
import { FactList } from "@/components/typed-fields/fact-list";
import { ownFieldFacts } from "@/components/typed-fields/own-field-facts";
import { type BookingFormData, nameOf } from "./booking-form-data";

export type BookingFactsProps = { booking: BookingDto; data: BookingFormData };

const count = ({ value }: { value: number | null }) => (value === null ? "–" : String(value));

/** Description list of a booking: customer, time, headcount, status, owners and own fields. */
export async function BookingFacts({ booking, data }: BookingFactsProps) {
  const t = await getTranslations("booking.fields");
  const common = await getTranslations("common");
  const format = await getFormatter();
  const type = data.types.find(({ id }) => id === booking.entityTypeId);
  const status = data.statuses.find(({ id }) => id === booking.bookingStatusId);
  const when = format.dateTimeRange(booking.startsAt, booking.endsAt, {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const facts = [
    { label: t("type"), value: type?.name ?? "–" },
    { label: t("customer"), value: nameOf({ options: data.customers, id: booking.customerId }) },
    { label: t("when"), value: when },
    { label: t("status"), value: status?.name ?? "–" },
    { label: t("estimatedHeadcount"), value: count({ value: booking.estimatedHeadcount }) },
    { label: t("guaranteedHeadcount"), value: count({ value: booking.guaranteedHeadcount }) },
    { label: t("salesOwner"), value: nameOf({ options: data.members, id: booking.salesOwnerId }) },
    {
      label: t("coordinator"),
      value: nameOf({ options: data.members, id: booking.coordinatorId }),
    },
    ...ownFieldFacts({
      type,
      stored: booking.fields,
      vocabularies: data.vocabularies,
      yesNo: { yes: common("yes"), no: common("no") },
    }),
  ];
  return <FactList facts={facts} />;
}
