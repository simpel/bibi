import type { InquiryDto } from "@okazi/core";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { nameOf } from "@/components/form/named-option";
import { FactList } from "@/components/typed-fields/fact-list";
import { ownFieldFacts } from "@/components/typed-fields/own-field-facts";
import { formatKr } from "../../item/ui/format-price";
import { desiredPeriod } from "./desired-period";
import type { InquiryFormData } from "./inquiry-form-data";

export type InquiryFactsProps = { inquiry: InquiryDto; data: InquiryFormData };

/** Description list of an inquiry: customer, contact, dates, quantity, budget, owner, fields. */
export async function InquiryFacts({ inquiry, data }: InquiryFactsProps) {
  const t = await getTranslations("inquiry.fields");
  const common = await getTranslations("common");
  const format = await getFormatter();
  const locale = await getLocale();
  const type = data.types.find(({ id }) => id === inquiry.entityTypeId);
  const budget = inquiry.budgetMinor;
  const facts = [
    { label: t("type"), value: type?.name ?? "–" },
    { label: t("customer"), value: nameOf({ options: data.customers, id: inquiry.customerId }) },
    { label: t("contact"), value: nameOf({ options: data.contacts, id: inquiry.contactId }) },
    { label: t("when"), value: desiredPeriod({ inquiry, format }) },
    { label: t("quantity"), value: inquiry.quantity === null ? "–" : String(inquiry.quantity) },
    { label: t("budget"), value: budget === null ? "–" : formatKr({ minor: budget, locale }) },
    { label: t("salesOwner"), value: nameOf({ options: data.members, id: inquiry.salesOwnerId }) },
    ...(inquiry.lossReason ? [{ label: t("lossReason"), value: inquiry.lossReason }] : []),
    ...ownFieldFacts({
      type,
      stored: inquiry.fields,
      vocabularies: data.vocabularies,
      links: data.links,
      yesNo: { yes: common("yes"), no: common("no") },
    }),
  ];
  return <FactList facts={facts} />;
}
