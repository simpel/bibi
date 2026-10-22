"use client";

import type { EntityTypeDto } from "@bibi/core";
import { useRouter } from "@bibi/i18n/navigation";
import { Form } from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import type { FieldPath, UseFormReturn } from "react-hook-form";
import type { TypedFormData } from "@/components/typed-fields/typed-form-data";
import { type TypedValues, TypedWizardStep } from "./typed-wizard-step";
import { useTypedWizard } from "./use-typed-wizard";
import { WizardFooter } from "./wizard-footer";
import { WizardProgress } from "./wizard-progress";

export type TypedWizardProps<V extends TypedValues, O> = {
  form: UseFormReturn<V, unknown, O>;
  data: TypedFormData;
  typeOf: (input: { id: string }) => EntityTypeDto | undefined;
  run: (input: { values: O }) => void;
  pending: boolean;
  /** The record's own fields (step "details"); `coreFields` are the form names they edit. */
  core: ReactNode;
  coreFields: FieldPath<V>[];
  typeLabel: string;
  /** A type is already chosen, e.g. from `?type=`: start on the details. */
  typeChosen: boolean;
  cancelHref: string;
};

/** Create a typed record (ticket, customer, …) one step at a time: type, details, own fields. */
export function TypedWizard<V extends TypedValues, O>(props: TypedWizardProps<V, O>) {
  const { form, data, typeOf, core, typeLabel, cancelHref } = props;
  const t = useTranslations("wizard");
  const router = useRouter();
  const wizard = useTypedWizard(props);
  const { type, steps } = wizard;
  const { step, index } = wizard;
  return (
    <Form {...form}>
      <form onSubmit={wizard.submit} noValidate className="grid max-w-2xl gap-6">
        <WizardProgress
          steps={steps.map((id) => ({ id, label: t(`steps.${id}`) }))}
          index={index}
          label={t("progress")}
        />
        <p className="text-sm text-muted-foreground">{t(`descriptions.${step}`)}</p>
        <TypedWizardStep
          form={form}
          step={step}
          type={type}
          data={data}
          typeOf={typeOf}
          typeLabel={typeLabel}
          core={core}
        />
        <WizardFooter
          first={index === 0}
          last={wizard.isLast}
          pending={props.pending}
          canSave={Boolean(type)}
          onBack={() => (index === 0 ? router.push(cancelHref) : wizard.setIndex(index - 1))}
          onNext={wizard.next}
        />
      </form>
    </Form>
  );
}
