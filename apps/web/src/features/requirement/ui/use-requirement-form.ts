import type { EntityTypeDto, RequirementDto } from "@bibi/core";
import { useRouter } from "@bibi/i18n/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { useTypedResolver } from "@/components/typed-fields/use-typed-resolver";
import { useFormAction } from "@/lib/use-form-action";
import { createRequirementAction, updateRequirementAction } from "../actions";
import type { RequirementFormData } from "./requirement-form-data";
import {
  type RequirementFormOutput,
  requirementFormSchema,
  toRequirementUpdate,
} from "./requirement-form-schema";
import { type RequirementFormValues, requirementFormDefaults } from "./requirement-form-values";

export type UseRequirementFormInput = {
  data: RequirementFormData;
  ticketId: string;
  /** Present = edit mode, absent = create mode. */
  requirement?: RequirementDto | undefined;
  onDone: () => void;
};

type SaveInput = {
  requirement: RequirementDto | undefined;
  values: RequirementFormOutput;
  type: EntityTypeDto | undefined;
};

/** Creates the requirement, or updates the one being edited. */
const save = ({ requirement, values, type }: SaveInput) =>
  requirement
    ? updateRequirementAction({ input: toRequirementUpdate({ requirement, values, type }) })
    : createRequirementAction({ input: values });

/** Requirement form state; the ticket page reloads with the changed counts. */
export function useRequirementForm({
  data,
  ticketId,
  requirement,
  onDone,
}: UseRequirementFormInput) {
  const t = useTranslations("requirement");
  const common = useTranslations("common");
  const router = useRouter();
  const typeOf = ({ id }: { id: string }) => data.types.find((type) => type.id === id);
  const resolver = useTypedResolver<RequirementFormValues, RequirementFormOutput>({
    types: data.types,
    schemaFor: ({ type }) =>
      requirementFormSchema({ ticketId, type, vocabularies: data.vocabularies }),
  });
  const initial = typeOf({ id: requirement?.entityTypeId ?? data.types[0]?.id ?? "" });
  const form = useForm<RequirementFormValues, unknown, RequirementFormOutput>({
    resolver,
    defaultValues: requirementFormDefaults({ type: initial, requirement }),
  });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) =>
      save({ requirement, values, type: typeOf({ id: values.entityTypeId }) }),
    messages: { pending: common("saving"), success: t(requirement ? "updated" : "created") },
    onSuccess: () => {
      onDone();
      router.refresh();
    },
    onError: ({ error }) => {
      if (error.code === "CONFLICT") form.setError("vocabularyValueId", { message: t("taken") });
    },
  });
  return { form, submit, pending, typeOf };
}
