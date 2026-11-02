import { Button, ChoiceCard, Skeleton } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { EmptyState } from "@/components/states/empty-state";
import { InlineLoadError } from "@/components/states/inline-load-error";
import { Link } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import { useDateTimeFormat } from "@/lib/time/use-date-time-format";
import { applyAnswers } from "./apply-answers";
import type { Completion } from "./complete-step";
import { FollowUpDialog, type FollowUpRequest } from "./follow-up-dialog";
import { followUpQuestions } from "./follow-up-questions";
import { periodOf } from "./intake-period";
import type { FollowUpAnswers, IntakePick, IntakeWhen, IntakeWho } from "./intake-state";
import type { PackageCardData, PackageOption } from "./package-groups";
import { PackageGroupsView } from "./package-groups-view";
import type { IntakeReview } from "./review-state";
import { SwitchDialog } from "./switch-dialog";
import { usePackageNext } from "./use-package-next";
import { type PackagePreview, usePackagePreview } from "./use-package-preview";

export type PackageStepProps = {
  who: IntakeWho;
  when: IntakeWhen;
  pick: IntakePick | null;
  /** Step 4 when it exists: its lines decide whether switching asks first. */
  review: IntakeReview | null;
  packages: PackageOption[];
  timeZone: string;
  /** A summary of the pick and its answers. */
  pickSummary: string;
  onPick: (input: { pick: IntakePick; when?: IntakeWhen }) => void;
  onUnpick: () => void;
  onNext: (input: Completion) => void;
};

function NoPackages({ onOneOff }: { onOneOff: () => void }) {
  const t = useTranslations("ticketIntake.package");
  const action = (
    <div className="flex flex-wrap justify-center gap-2">
      <Button type="button" onClick={onOneOff}>
        {t("oneOff")}
      </Button>
      <Button asChild variant="outline">
        <Link href={ROUTES.ticketTemplateNew}>{t("createPackage")}</Link>
      </Button>
    </div>
  );
  return <EmptyState title={t("none")} description={t("noneDescription")} action={action} />;
}

type PickingInput = Pick<PackageStepProps, "when" | "timeZone" | "onPick" | "onUnpick">;

/** Opens the follow-up dialog when the package needs answers, else picks it as it is. */
function usePackagePicking({ when, timeZone, onPick, onUnpick }: PickingInput) {
  const [request, setRequest] = useState<FollowUpRequest | null>(null);
  const pickPackage = ({ card }: { card: PackageCardData }) => {
    const { id: templateId, name } = card.option;
    const questions = followUpQuestions({ entry: card.entry, headcount: when.guests });
    if (questions.length === 0) {
      onPick({ pick: { kind: "PACKAGE", templateId, name, answers: {} } });
      return;
    }
    onUnpick();
    setRequest({ templateId, name, questions });
  };
  const answered = ({ answers }: { answers: FollowUpAnswers }) => {
    if (!request) return;
    const { templateId, name, questions } = request;
    const next = applyAnswers({ when, questions, answers, timeZone });
    onPick({ pick: { kind: "PACKAGE", templateId, name, answers }, when: next });
    setRequest(null);
  };
  return { request, cancel: () => setRequest(null), pickPackage, answered };
}

type BodyProps = Pick<PackageStepProps, "when" | "pick" | "packages" | "timeZone"> & {
  preview: PackagePreview;
  onPackage: (input: { card: PackageCardData }) => void;
  onOneOff: () => void;
};

/** The preview's groups once loaded; a failed preview still offers the One-off. */
function PreviewBody({ when, pick, packages, timeZone, preview, onPackage, onOneOff }: BodyProps) {
  const t = useTranslations("ticketIntake.package");
  const dates = useDateTimeFormat();
  const period = periodOf({ when, timeZone });
  const headcount = when.guests;
  const span = period ? dates.dateTimeRange({ start: period.startsAt, end: period.endsAt }) : "";
  if (preview.status === "loading") return <Skeleton className="h-32 w-full" />;
  if (preview.status === "error") {
    return (
      <>
        <InlineLoadError errorKey={preview.errorKey} />
        <ChoiceCard title={t("oneOff")} selected={pick?.kind === "ONE_OFF"} onClick={onOneOff} />
      </>
    );
  }
  if (preview.status !== "ready") return null;
  return (
    <PackageGroupsView
      {...{ options: packages, preview: preview.preview, headcount, pick, onPackage, onOneOff }}
      availableHeading={t("groups.available", { period: span, guests: headcount })}
    />
  );
}

/** Step 3: every active package grouped by one preview, the One-off card and the follow-up. */
export function PackageStep(props: PackageStepProps) {
  const t = useTranslations("ticketIntake.package");
  const { who, when, pick, packages, timeZone } = props;
  const { request, cancel, pickPackage, answered } = usePackagePicking(props);
  const oneOff = () => props.onPick({ pick: { kind: "ONE_OFF" } });
  const preview = usePackagePreview({
    ...{ customerId: who.customerId, period: periodOf({ when, timeZone }), headcount: when.guests },
    packageIds: packages.map(({ id }) => id),
  });
  const next = usePackageNext({ ...props, preview, onNext: props.onNext });
  return (
    <div className="grid gap-4">
      {packages.length === 0 ? (
        <NoPackages onOneOff={oneOff} />
      ) : (
        <PreviewBody {...props} preview={preview} onPackage={pickPackage} onOneOff={oneOff} />
      )}
      {pick ? <p className="text-sm">{t("picked", { summary: props.pickSummary })}</p> : null}
      <Button
        type="button"
        className="justify-self-start"
        disabled={!next.ready}
        onClick={next.next}
      >
        {props.review ? t("backToReview") : t("next")}
      </Button>
      {request ? (
        <FollowUpDialog {...{ request, when, timeZone }} onCancel={cancel} onDone={answered} />
      ) : null}
      {next.question ? (
        <SwitchDialog
          question={next.question}
          count={props.review?.lines.length ?? 0}
          onChoice={next.choose}
          onCancel={next.cancel}
        />
      ) : null}
    </div>
  );
}
