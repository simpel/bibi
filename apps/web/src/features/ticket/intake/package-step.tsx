import { Button, Skeleton, StepSection, type StepSectionProps } from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { InlineLoadError } from "@/components/states/inline-load-error";
import { useDateTimeFormat } from "@/lib/time/use-date-time-format";
import type { Completion } from "./complete-step";
import { CustomBookingButton } from "./custom-booking-button";
import { FollowUpDialog } from "./follow-up-dialog";
import { periodOf } from "./intake-period";
import type { IntakePick, IntakeWhen, IntakeWho } from "./intake-state";
import { NoPackages } from "./no-packages";
import { PackageActions } from "./package-actions";
import type { PackageCardData, PackageOption } from "./package-groups";
import { PackageGroupsView } from "./package-groups-view";
import { ReplaceDialog } from "./replace-dialog";
import type { IntakeReview } from "./review-state";
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
  /** The lines when they exist: replacing them asks first. */
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

/** The preview's tabs once loaded; a failed preview still leaves Custom booking. */
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

/** Step 3: every active package in two tabs by one preview, Custom booking under them. */
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
  const next = usePackageNext({ ...props, preview });
  return (
    <StepSection
      {...props.section}
      actions={<PackageActions canCreatePackage={props.canCreatePackage} />}
      footerStart={props.back}
      footerEnd={
        <Button type="button" disabled={!next.ready} onClick={next.next}>
          {intake("next")}
        </Button>
      }
    >
      <PreviewBody {...props} preview={preview} onPackage={pickPackage} />
      {pick?.kind === "PACKAGE" ? (
        <p className="text-sm">{t("picked", { summary: props.pickSummary })}</p>
      ) : null}
      <CustomBookingButton picked={pick?.kind === "ONE_OFF"} onClick={next.custom} />
      {request ? (
        <FollowUpDialog {...{ request, when, timeZone }} onCancel={cancel} onDone={answered} />
      ) : null}
      {next.replacing > 0 ? (
        <ReplaceDialog count={next.replacing} onReplace={next.confirm} onCancel={next.cancel} />
      ) : null}
    </StepSection>
  );
}
