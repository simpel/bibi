import { useTranslations } from "next-intl";
import { useDateTimeFormat } from "@/lib/time/use-date-time-format";
import { useOrganizationTimeZone } from "@/lib/time/use-organization-time-zone";
import { fromEmailSteps } from "./from-email";
import { periodOf } from "./intake-period";
import type { InputStep, IntakePick, IntakeState, IntakeWhen } from "./intake-state";

export type IntakeSummaries = { who: string; when: string; pick: string };

type Translate = ReturnType<typeof useTranslations<"ticketIntake.summary">>;

type PickInput = { t: Translate; pick: IntakePick | null; when: IntakeWhen | null; times: string };

/** "Half day · 30 guests · Extended to 17:00 · Moved to 13:00–17:00", or "Custom booking". */
function pickSummary({ t, pick, when, times }: PickInput): string {
  if (!pick) return "";
  if (pick.kind === "ONE_OFF") return t("custom");
  const { answers } = pick;
  const parts = [pick.name];
  if (answers.guests === "CHANGE") parts.push(t("guestsChanged", { guests: when?.guests ?? 0 }));
  if (answers.guests === "KEEP") parts.push(t("guestsKept", { guests: when?.guests ?? 0 }));
  if (answers.end === "EXTEND") parts.push(t("extended", { times }));
  if (answers.end === "KEEP") parts.push(t("shortened"));
  if (answers.clash === "MOVE") parts.push(t("moved", { times }));
  if (answers.clash === "PREBOOK") parts.push(t("prebooked"));
  return parts.join(" · ");
}

/** The one-line summaries done steps show, in the user's formats and the organization's zone. */
export function useIntakeSummaries({ state }: { state: IntakeState }): IntakeSummaries {
  const t = useTranslations("ticketIntake.summary");
  const message = useTranslations("ticketIntake.message");
  const dates = useDateTimeFormat();
  const timeZone = useOrganizationTimeZone();
  const { who, when, pick } = state;
  const period = when ? periodOf({ when, timeZone }) : null;
  const span = period ? dates.dateTimeRange({ start: period.startsAt, end: period.endsAt }) : "";
  const times = period ? dates.timeRange({ start: period.startsAt, end: period.endsAt }) : "";
  // Values that came from a read message say so (spec "The page").
  const fromEmail = fromEmailSteps({ state });
  const mark = ({ step, text }: { step: InputStep; text: string }) =>
    text && fromEmail.includes(step) ? `${text} · ${message("fromEmail")}` : text;
  return {
    who: mark({
      step: "who",
      text: who ? t("who", { customer: who.customerName, contact: who.contactName }) : "",
    }),
    when: mark({
      step: "when",
      text: when ? t("when", { period: span, guests: when.guests }) : "",
    }),
    pick: mark({ step: "package", text: pickSummary({ t, pick, when, times }) }),
  };
}
