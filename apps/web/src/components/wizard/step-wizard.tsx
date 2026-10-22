"use client";

import { Form } from "@bibi/ui";
import type { ReactNode } from "react";
import type { FieldPath, FieldValues, UseFormReturn } from "react-hook-form";
import { useRouter } from "@/lib/navigation";
import { useWizard } from "./use-wizard";
import { WizardFooter } from "./wizard-footer";
import { WizardProgress } from "./wizard-progress";

export type WizardStepDef<V extends FieldValues> = {
  id: string;
  label: string;
  description: string;
  /** The form names the step edits: Next validates them. */
  fields: FieldPath<V>[];
  content: ReactNode;
};

export type StepWizardProps<V extends FieldValues, O> = {
  form: UseFormReturn<V, unknown, O>;
  steps: WizardStepDef<V>[];
  run: (input: { values: O }) => void;
  pending: boolean;
  cancelHref: string;
  progressLabel: string;
};

/** A create form split into fixed steps; the last one saves. For records without a type. */
export function StepWizard<V extends FieldValues, O>(props: StepWizardProps<V, O>) {
  const { form, steps, pending, cancelHref } = props;
  const router = useRouter();
  const wizard = useWizard({
    form,
    steps: steps.map(({ id }) => id),
    fieldsOf: ({ step }) => steps.find(({ id }) => id === step)?.fields ?? [],
    run: props.run,
  });
  const current = steps[wizard.index];
  return (
    <Form {...form}>
      <form onSubmit={wizard.submit} noValidate className="grid max-w-2xl gap-6">
        <WizardProgress steps={steps} index={wizard.index} label={props.progressLabel} />
        <p className="text-sm text-muted-foreground">{current?.description}</p>
        {current?.content}
        <WizardFooter
          first={wizard.index === 0}
          last={wizard.isLast}
          pending={pending}
          canSave
          onBack={() =>
            wizard.index === 0 ? router.push(cancelHref) : wizard.setIndex(wizard.index - 1)
          }
          onNext={wizard.next}
        />
      </form>
    </Form>
  );
}
