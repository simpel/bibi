import { Button } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { plainDayText } from "@/lib/time/plain-day";
import { useDateTimeFormat } from "@/lib/time/use-date-time-format";
import { useOrganizationTimeZone } from "@/lib/time/use-organization-time-zone";
import type { IntakeState } from "./intake-state";

export type DraftOfferProps = {
  draft: IntakeState;
  onContinue: () => void;
  onDiscard: () => void;
};

/** "Continue the draft for <customer> (<date>, <guests> guests)?" with Continue and Discard. */
export function DraftOffer({ draft, onContinue, onDiscard }: DraftOfferProps) {
  const t = useTranslations("ticketIntake.draft");
  const dates = useDateTimeFormat();
  const timeZone = useOrganizationTimeZone();
  // A read message not yet walked through names the customer it matched or searches for.
  const customer =
    draft.who?.customerName ?? draft.draft?.who?.customerName ?? draft.draft?.search ?? "";
  const question = draft.when
    ? t("offerWithDate", {
        customer,
        date: plainDayText({ day: draft.when.date, timeZone, dates }),
        guests: draft.when.guests,
      })
    : t("offer", { customer });
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-md border border-primary/30 bg-accent p-3">
      <p className="flex-1 text-sm">{question}</p>
      <div className="flex gap-2">
        <Button type="button" size="sm" onClick={onContinue}>
          {t("continue")}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onDiscard}>
          {t("discard")}
        </Button>
      </div>
    </div>
  );
}
