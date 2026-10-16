import type { EntityTypeDto, ProgramItemDto } from "@okazi/core";
import { useRouter } from "@okazi/i18n/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { useTypedResolver } from "@/components/typed-fields/use-typed-resolver";
import { useFormAction } from "@/lib/use-form-action";
import { createProgramItemAction, updateProgramItemAction } from "../actions";
import type { ProgramFormData } from "./program-form-data";
import {
  type ProgramItemFormOutput,
  programItemFormSchema,
  toProgramItemUpdate,
} from "./program-item-form-schema";
import { type ProgramItemFormValues, programItemFormDefaults } from "./program-item-form-values";

export type UseProgramItemFormInput = {
  data: ProgramFormData;
  bookingId: string;
  /** Where a new program item starts by default. */
  startsAt: Date;
  /** Present = edit mode, absent = create mode. */
  programItem?: ProgramItemDto | undefined;
  onDone: () => void;
};

type SaveInput = {
  programItem: ProgramItemDto | undefined;
  values: ProgramItemFormOutput;
  type: EntityTypeDto | undefined;
};

/** Creates the program item, or updates the one being edited. */
const save = ({ programItem, values, type }: SaveInput) =>
  programItem
    ? updateProgramItemAction({ input: toProgramItemUpdate({ programItem, values, type }) })
    : createProgramItemAction({ input: values });

/** Program item form state; the booking page reloads with the changed run schedule. */
export function useProgramItemForm({
  data,
  bookingId,
  startsAt,
  programItem,
  onDone,
}: UseProgramItemFormInput) {
  const t = useTranslations("programItem");
  const common = useTranslations("common");
  const router = useRouter();
  const typeOf = ({ id }: { id: string }) => data.types.find((type) => type.id === id);
  const resolver = useTypedResolver<ProgramItemFormValues, ProgramItemFormOutput>({
    types: data.types,
    schemaFor: ({ type }) =>
      programItemFormSchema({ bookingId, type, vocabularies: data.vocabularies }),
  });
  const initial = typeOf({ id: programItem?.entityTypeId ?? data.types[0]?.id ?? "" });
  const form = useForm<ProgramItemFormValues, unknown, ProgramItemFormOutput>({
    resolver,
    defaultValues: programItemFormDefaults({ type: initial, programItem, startsAt }),
  });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) =>
      save({ programItem, values, type: typeOf({ id: values.entityTypeId }) }),
    messages: { pending: common("saving"), success: t(programItem ? "updated" : "created") },
    onSuccess: () => {
      onDone();
      router.refresh();
    },
    onError: ({ error }) => {
      if (error.code === "CONFLICT") form.setError("itemId", { message: t("occupied") });
    },
  });
  return { form, submit, pending, typeOf };
}
