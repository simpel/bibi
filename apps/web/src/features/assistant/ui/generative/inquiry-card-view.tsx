"use client";

import { Link } from "@okazi/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@okazi/ui";
import { useFormatter, useTranslations } from "next-intl";
import { desiredPeriod } from "@/features/inquiry/ui/desired-period";
import { InquiryStatusBadge } from "@/features/inquiry/ui/inquiry-status-badge";
import { inquiryRoute } from "@/lib/routes";
import type { GenerativeProps } from "./generative-props";

import { fieldLines } from "./item-facts";

export type InquiryCardViewProps = GenerativeProps<"inquiry-card">;

/** One inquiry: status, desired dates, quantity, loss reason and own fields. */
export function InquiryCardView({ inquiry }: InquiryCardViewProps) {
  const t = useTranslations("assistant.ui.inquiry");
  const format = useFormatter();
  const href = inquiryRoute({ id: inquiry.id });
  const created = format.dateTime(new Date(inquiry.createdAt), { dateStyle: "medium" });
  return (
    <Card data-slot="inquiry-card" className="shadow-none">
      <CardHeader className="flex-row items-start justify-between gap-2 p-4 pb-2">
        <CardTitle className="text-base">
          <Link href={href} className="hover:underline">
            {t("title", { date: created })}
          </Link>
        </CardTitle>
        <InquiryStatusBadge status={inquiry.inquiryStatus} />
      </CardHeader>
      <CardContent className="grid gap-1 p-4 pt-0 text-sm text-muted-foreground">
        <p>{desiredPeriod({ format, inquiry })}</p>
        {inquiry.quantity === null ? null : <p>{t("quantity", { count: inquiry.quantity })}</p>}
        {inquiry.lossReason ? <p>{t("lossReason", { reason: inquiry.lossReason })}</p> : null}
        {fieldLines({ fields: inquiry.fields }).map((line) => (
          <p key={line}>{line}</p>
        ))}
        <Link href={href} className="text-primary hover:underline">
          {t("open")}
        </Link>
      </CardContent>
    </Card>
  );
}
