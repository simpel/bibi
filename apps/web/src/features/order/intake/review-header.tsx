import { useTranslations } from "next-intl";
import { useDateTimeFormat } from "@/lib/time/use-date-time-format";
import type { ReviewModel } from "./use-review-model";

/** Customer, date and guests, and that nothing is saved until Create (spec step 4 "Header"). */
export function ReviewHeader({ model }: { model: ReviewModel }) {
  const t = useTranslations("orderIntake.review");
  const dates = useDateTimeFormat();
  const { who, when, period } = model;
  const span = period ? dates.dateTimeRange({ start: period.startsAt, end: period.endsAt }) : "";
  return (
    <div className="grid gap-0.5">
      <p className="font-medium">
        {t("header", { customer: who.customerName, period: span, guests: when.guests })}
      </p>
      <p className="text-sm text-muted-foreground">{t("nothingSaved")}</p>
    </div>
  );
}
