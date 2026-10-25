import { useTranslations } from "next-intl";
import { useDateTimeFormat } from "@/lib/time/use-date-time-format";

type DateValue = Date | string | null;

export type PriceListValidityProps = { validFrom: DateValue; validTo: DateValue };

/** Validity as inclusive dates, e.g. "1 Jan 2026 – 31 Dec 2026" or "Always valid". */
export function PriceListValidity({ validFrom, validTo }: PriceListValidityProps) {
  const t = useTranslations("priceList.validity");
  const format = useDateTimeFormat();
  const day = ({ value }: { value: Date | string }) =>
    format.date({ instant: value, timeZone: "UTC" });
  if (validFrom && validTo)
    return t("range", { from: day({ value: validFrom }), to: day({ value: validTo }) });
  if (validFrom) return t("from", { from: day({ value: validFrom }) });
  if (validTo) return t("to", { to: day({ value: validTo }) });
  return t("always");
}

export type PriceListPricingProps = { discountPercent: number | null; itemCount: number };

/** A general discount ("15 % discount") or the number of agreed item prices. */
export function PriceListPricing({ discountPercent, itemCount }: PriceListPricingProps) {
  const t = useTranslations("priceList.pricing");
  return discountPercent === null
    ? t("items", { count: itemCount })
    : t("discount", { percent: discountPercent });
}
