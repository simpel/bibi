import type { CustomerDto, EntityTypeDto, VocabularyDto } from "@okazi/core";
import { getTranslations } from "next-intl/server";
import { FactList } from "@/components/typed-fields/fact-list";
import { ownFieldFacts } from "@/components/typed-fields/own-field-facts";
import type { LinkTargets } from "@/components/typed-fields/typed-form-data";

export type CustomerFactsProps = {
  customer: CustomerDto;
  type: EntityTypeDto | undefined;
  vocabularies: VocabularyDto[];
  links: LinkTargets;
  locale: string;
};

const dash = ({ value }: { value: string | number | null }) =>
  value === null || value === "" ? "–" : String(value);

/** Description list of a customer: contact details, invoice details and the type's own fields. */
export async function CustomerFacts(props: CustomerFactsProps) {
  const { customer, type, vocabularies, links, locale } = props;
  const t = await getTranslations("customer");
  const common = await getTranslations("common");
  const yesNo = { yes: common("yes"), no: common("no") };
  const address = [
    customer.invoiceStreetAddress,
    [customer.invoicePostalCode, customer.invoiceCity].filter(Boolean).join(" "),
    customer.invoiceCountry,
  ].filter(Boolean);
  const credit = customer.creditLimitMinor;
  const facts = [
    { label: t("fields.type"), value: type?.name ?? "–" },
    { label: t("fields.email"), value: dash({ value: customer.email }) },
    { label: t("fields.phone"), value: dash({ value: customer.phone }) },
    { label: t("invoiceAddress"), value: address.join(", ") },
    { label: t("fields.paymentTermsDays"), value: dash({ value: customer.paymentTermsDays }) },
    {
      label: t("fields.creditLimit"),
      value: credit === null ? "–" : (credit / 100).toLocaleString(locale),
    },
    ...ownFieldFacts({ type, stored: customer.fields, vocabularies, links, yesNo }),
  ];
  return <FactList facts={facts} />;
}
