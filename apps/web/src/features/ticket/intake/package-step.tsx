import { Button, Skeleton, StepSection, type StepSectionProps } from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { InlineLoadError } from "@/components/states/inline-load-error";
import { useDateTimeFormat } from "@/lib/time/use-date-time-format";
import type { Completion } from "./complete-step";
import { FollowUpDialog } from "./follow-up-dialog";
import { periodOf } from "./intake-period";
import type { IntakePick, IntakeWhen, IntakeWho } from "./intake-state";
import { NoPackages } from "./no-packages";
import { PackageActions } from "./package-actions";
import type { PackageCardData, PackageOption } from "./package-groups";
import { PackageGroupsView } from "./package-groups-view";
import type { IntakeReview } from "./review-state";
import { SwitchDialog } from "./switch-dialog";
import { usePackageNext } from "./use-package-next";
import { usePackagePicking, useSuggestedPick } from "./use-package-picking";
import { type PackagePreview, usePackagePreview } from "./use-package-preview";

export type PackageStepProps = {
  /** The step section's number, title, state, summary and Change. */
  section: Omit<StepSectionProps, "children">;
  /** Back, bottom left. */
  back: ReactNode;
  who: IntakeWho;
  when: IntakeWhen;
  pick: IntakePick | null;
  /** Step 4 when it exists: its lines decide whether switching asks first. */
  review: IntakeReview | null;
  packages: PackageOption[];
  canCreatePackage: boolean;
  timeZone: string;
  /** The package a read message suggests (★, preselected; ADR 0084), or null. */
  suggestedId: string | null;
  /** A summary of the pick and its answers. */
  pickSummary: string;
  onPick: (input: { pick: IntakePick; when?: IntakeWhen }) => void;
  onUnpick: () => void;
  onNext: (input: Completion) => void;
};

type BodyProps = Pick<PackageStepProps, "when" | "pick" | "packages" | "timeZone"> & {
  suggestedId: string | null;
  preview: PackagePreview;
  onPackage: (input: { card: PackageCardData }) => void;
};

/** The preview's groups once loaded; a failed preview still leaves the One-off action. */
function PreviewBody({ when, timeZone, preview, ...props }: BodyProps) {
  const dates = useDateTimeFormat();
  const period = periodOf({ when, timeZone });
  const span = period ? dates.dateTimeRange({ start: period.startsAt, end: period.endsAt }) : "";
  if (props.packages.length === 0) return <NoPackages />;
  if (preview.status === "loading") return <Skeleton className="h-32 w-full" />;
  if (preview.status === "error") return <InlineLoadError errorKey={preview.errorKey} />;
  if (preview.status !== "ready") return null;
  return (
    <PackageGroupsView
      {...{ options: props.packages, preview: preview.preview, period: span }}
      {...{ headcount: when.guests, pick: props.pick, onPackage: props.onPackage }}
      suggestedId={props.suggestedId}
    />
  );
}

/** Step 3: every active package grouped by one preview, One-off and Create package on top. */
export function PackageStep(props: PackageStepProps) {
  const t = useTranslations("ticketIntake.package");
  const intake = useTranslations("ticketIntake");
  const { who, when, pick, packages, timeZone, suggestedId } = props;
  const { request, cancel, pickPackage, answered } = usePackagePicking(props);
  const preview = usePackagePreview({
    ...{ customerId: who.customerId, period: periodOf({ when, timeZone }), headcount: when.guests },
    packageIds: packages.map(({ id }) => id),
  });
  useSuggestedPick({ suggestedId, pick, preview, packages, pickPackage });
  const next = usePackageNext({ ...props, preview, onNext: props.onNext });
  const oneOff = () => props.onPick({ pick: { kind: "ONE_OFF" } });
  return (
    <StepSection
      {...props.section}
      actions={<PackageActions {...props} oneOff={pick?.kind === "ONE_OFF"} onOneOff={oneOff} />}
      footerStart={props.back}
      footerEnd={
        <Button type="button" disabled={!next.ready} onClick={next.next}>
          {intake("next")}
        </Button>
      }
    >
      <PreviewBody {...props} preview={preview} onPackage={pickPackage} />
      {pick ? <p className="text-sm">{t("picked", { summary: props.pickSummary })}</p> : null}
      {request ? (
        <FollowUpDialog {...{ request, when, timeZone }} onCancel={cancel} onDone={answered} />
      ) : null}
      {next.question ? (
        <SwitchDialog {...next} question={next.question} count={props.review?.lines.length ?? 0} />
      ) : null}
    </StepSection>
  );
}
