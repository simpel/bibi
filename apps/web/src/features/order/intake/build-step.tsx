import { Button, Form, StepSection, StepSectionFooter } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useOrganizationTimeZone } from "@/lib/time/use-organization-time-zone";
import { CalendarSnapshot } from "./calendar-snapshot";
import { choiceKeysOf } from "./choice-lines";
import { isCustom } from "./intake-state";
import { LineDialogSlot, LinesSection } from "./lines-section";
import { OrderTypeFields, SavePackageFields } from "./review-form-fields";
import type { StepsProps } from "./section-props";
import { StepBack } from "./step-back";
import { useReviewActions } from "./use-review-actions";
import { useReviewForm } from "./use-review-form";
import { type ReviewModel, useReviewModel } from "./use-review-model";

type BuildProps = Omit<StepsProps, "summaries">;

const ignore = () => undefined;

/** The build step's form: the review's own, never submitted here; every change syncs to it. */
function BuildBody({ model }: { model: ReviewModel }) {
  const t = useTranslations("orderIntake");
  const { form } = useReviewForm({ model, onConflict: ignore, onUnmappedIssues: ignore });
  const actions = useReviewActions({ model, form });
  const { catalog } = model.data;
  const { lines } = model.review;
  const next = async () => {
    // The type's required fields are asked here, so Next stays while one is missing.
    if (!(await form.trigger(["entityTypeId", "fields"]))) return;
    const choiceKeys = choiceKeysOf({ lines, items: catalog.items });
    model.dispatch({ type: "completeBuild", choiceKeys });
  };
  return (
    <Form {...form}>
      <form onSubmit={(event) => event.preventDefault()} noValidate className="grid gap-5">
        <OrderTypeFields form={form} catalog={catalog} type={model.orderType} custom />
        <CalendarSnapshot model={model} nonce={0} />
        <LinesSection model={model} actions={actions} />
        <SavePackageFields form={form} />
        <StepSectionFooter
          start={<StepBack step="custom" state={model.state} dispatch={model.dispatch} />}
          end={
            <>
              {lines.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("build.addLineFirst")}</p>
              ) : null}
              <Button type="button" disabled={lines.length === 0} onClick={next}>
                {t("next")}
              </Button>
            </>
          }
        />
      </form>
      <LineDialogSlot model={model} actions={actions} />
    </Form>
  );
}

/** The open build step: the review's model, loaded only while it is open. */
function OpenBuild({ data, state, dispatch }: BuildProps) {
  const timeZone = useOrganizationTimeZone();
  const model = useReviewModel({ data, state, dispatch, timeZone, nonce: 0 });
  if (!model) return null;
  return <BuildBody key={state.intakeKey} model={model} />;
}

/**
 * Step 4 of a custom booking (spec "Build the booking"): its type and fields, its lines with
 * the calendar, and saving them as a package. Next goes on to choices or review.
 */
export function BuildSection({ data, state, dispatch }: BuildProps) {
  const t = useTranslations("orderIntake");
  if (!isCustom({ state })) return null;
  const open = state.open === "custom";
  const done = state.open === "choices" || state.open === "review";
  return (
    <StepSection
      number={4}
      title={t("build.title")}
      summary={t("build.summary", { lines: state.review?.lines.length ?? 0 })}
      state={open ? "open" : done ? "done" : "locked"}
      changeLabel={t("change")}
      onChangeStep={() => dispatch({ type: "change", step: "custom" })}
    >
      {open ? <OpenBuild data={data} state={state} dispatch={dispatch} /> : null}
    </StepSection>
  );
}
