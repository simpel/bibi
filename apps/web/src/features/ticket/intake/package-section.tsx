import { StepSection } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useOrganizationTimeZone } from "@/lib/time/use-organization-time-zone";
import { PackageStep } from "./package-step";
import { type StepsProps, sectionProps } from "./section-props";
import { StepBack } from "./step-back";

/**
 * Step 3's section: collapsed or locked as a plain section; open, `PackageStep` owns it (its
 * preview, actions and Next run only while it is open).
 */
export function PackageSection({ data, state, dispatch, summaries }: StepsProps) {
  const t = useTranslations("ticketIntake");
  const timeZone = useOrganizationTimeZone();
  const section = {
    ...{ number: 3, title: t("package.title"), summary: summaries.pick },
    ...sectionProps({ state, dispatch, step: "package", changeLabel: t("change") }),
  };
  const { who, when, pick } = state;
  if (section.state !== "open" || !who || !when) return <StepSection {...section} />;
  return (
    <PackageStep
      {...{ section, who, when, pick, timeZone, review: state.review }}
      {...{ packages: data.packages, canCreatePackage: data.canCreatePackage }}
      back={<StepBack step="package" dispatch={dispatch} />}
      suggestedId={state.draft?.templateId ?? null}
      pickSummary={summaries.pick}
      onPick={(input) => dispatch({ type: "pick", ...input })}
      onUnpick={() => dispatch({ type: "unpick" })}
      onNext={(lines) => dispatch({ type: "completePackage", ...lines })}
    />
  );
}
