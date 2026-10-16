import { zodResolver } from "@hookform/resolvers/zod";
import type { ProgramItemDto } from "@okazi/core";
import { useRouter } from "@okazi/i18n/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { useFormAction } from "@/lib/use-form-action";
import { useZodMessages } from "@/lib/use-zod-messages";
import { NONE } from "../../booking/ui/option-select-field";
import { assignProgramItemAction } from "../actions";
import {
  type AssignResponsibleFormOutput,
  type AssignResponsibleFormValues,
  assignResponsibleFormSchema,
} from "./assign-responsible-form-schema";

export type UseAssignResponsibleFormInput = { programItem: ProgramItemDto; onDone: () => void };

/** Responsible person form state (`programItem.assign`). */
export function useAssignResponsibleForm({ programItem, onDone }: UseAssignResponsibleFormInput) {
  const t = useTranslations("programItem");
  const common = useTranslations("common");
  const router = useRouter();
  const form = useForm<AssignResponsibleFormValues, unknown, AssignResponsibleFormOutput>({
    resolver: zodResolver(assignResponsibleFormSchema({ id: programItem.id }), useZodMessages()),
    defaultValues: { responsibleId: programItem.responsibleId ?? NONE },
  });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => assignProgramItemAction({ input: values }),
    messages: { pending: common("saving"), success: t("assigned") },
    onSuccess: () => {
      router.refresh();
      onDone();
    },
  });
  return { form, submit, pending };
}
