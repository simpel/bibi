import { Button, StepSection } from "@bibi/ui";
import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { DraftOffer } from "./draft-offer";
import type { IntakeWho } from "./intake-state";
import { type StepsProps, sectionProps } from "./section-props";
import type { IntakeDraft } from "./use-intake-draft";
import { useWhoFlow } from "./use-who-flow";
import { WhoStep } from "./who-step";

export type WhoSectionProps = StepsProps & { search: string | null; draft: IntakeDraft };

type OpenProps = WhoSectionProps & {
  section: ReturnType<typeof sectionProps> & { number: number; title: string; summary: string };
  /** The chosen customer, or the one a read message matched (preselected, ADR 0084). */
  who: IntakeWho | null;
};

/** The open step 1: its flow lives only while open, so a reopened step starts fresh. */
function OpenWhoSection({ data, dispatch, section, who, search, draft }: OpenProps) {
  const t = useTranslations("ticketIntake.who");
  const flow = useWhoFlow({ initial: who ? { id: who.customerId, name: who.customerName } : null });
  return (
    <StepSection
      {...section}
      actions={
        <Button type="button" variant="outline" size="sm" onClick={flow.newCustomer}>
          <PlusIcon aria-hidden />
          {t("newCustomerAction")}
        </Button>
      }
    >
      {draft.offer ? (
        <DraftOffer
          draft={draft.offer}
          onContinue={draft.continueDraft}
          onDiscard={draft.discardDraft}
        />
      ) : null}
      <WhoStep
        {...{ who, recent: data.recent, search, flow }}
        {...{ customerTypes: data.customerTypes, contactTypes: data.contactTypes }}
        onDone={({ who: next }) => dispatch({ type: "setWho", who: next })}
      />
    </StepSection>
  );
}

/** Step 1 with the offer to continue a local draft (`useIntakeDraft`, held by the page). */
export function WhoSection(props: WhoSectionProps) {
  const { state, dispatch, summaries, search } = props;
  const t = useTranslations("ticketIntake");
  const section = {
    ...{ number: 1, title: t("who.title"), summary: summaries.who },
    ...sectionProps({ state, dispatch, step: "who", changeLabel: t("change") }),
  };
  if (section.state !== "open") return <StepSection {...section} />;
  const who = state.who ?? state.draft?.who ?? null;
  return (
    <OpenWhoSection
      key={`${search ?? ""}|${who?.customerId ?? ""}`}
      {...props}
      section={section}
      who={who}
    />
  );
}
