import type { EntityTypeDto, RequirementDto } from "@bibi/core";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { useTypedResolver } from "@/components/typed-fields/use-typed-resolver";
import { useRouter } from "@/lib/navigation";
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
  orderId: string;
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

type ListOfValueInput = { data: RequirementFormData; valueId: string | undefined };

/** The list holding the value being edited, else the only list to count against. */
const listOfValue = ({ data, valueId }: ListOfValueInput): string => {
  const holding = data.vocabularies.find((list) => list.values.some(({ id }) => id === valueId));
  const [sole] = data.lists;
  return holding?.id ?? (data.lists.length === 1 && sole ? sole.id : "");
};

/** Requirement form state; the order page reloads with the changed counts. */
export function useRequirementForm({
  data,
  orderId,
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
      requirementFormSchema({ orderId, type, vocabularies: data.vocabularies }),
  });
  const firstActive = data.types.find((type) => type.status === "ACTIVE");
  const initial = typeOf({ id: requirement?.entityTypeId ?? firstActive?.id ?? "" });
  const form = useForm<RequirementFormValues, unknown, RequirementFormOutput>({
    resolver,
    defaultValues: requirementFormDefaults({
      type: initial,
      requirement,
      vocabularyId: listOfValue({ data, valueId: requirement?.vocabularyValueId }),
    }),
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
