import "server-only";
import type { BillingDto } from "@bibi/core";
import { getTranslations } from "next-intl/server";
import { getNumberFormat } from "@/server/number-format";
import type { PlanOption } from "./ui/plan-picker";

export type PlanTextsInput = { prices: BillingDto["prices"]; includedSeats: number };

export type PlanTexts = { plans: PlanOption[]; seats: string; seatPrice: string };

/** Both plans and the seat line, formatted on the server in the user's money format. */
export async function planTexts({ prices, includedSeats }: PlanTextsInput): Promise<PlanTexts> {
  const [t, numbers] = await Promise.all([getTranslations("billing.plans"), getNumberFormat()]);
  const { currency, baseMonthlyMinor, baseYearlyMinor, seatMonthlyMinor } = prices;
  const money = ({ minor }: { minor: number }) => numbers.money({ minor, currency });
  const saving = money({ minor: Math.max(0, baseMonthlyMinor * 12 - baseYearlyMinor) });
  const seatPrice = money({ minor: seatMonthlyMinor });
  return {
    plans: [
      {
        interval: "MONTH",
        title: t("month"),
        price: t("monthPrice", { price: money({ minor: baseMonthlyMinor }) }),
        note: t("monthNote"),
        badge: null,
      },
      {
        interval: "YEAR",
        title: t("year"),
        price: t("yearPrice", { price: money({ minor: baseYearlyMinor }) }),
        note: t("yearNote", { saving }),
        badge: t("saveBadge"),
      },
    ],
    seats: t("seats", { included: includedSeats, price: seatPrice }),
    seatPrice,
  };
}
