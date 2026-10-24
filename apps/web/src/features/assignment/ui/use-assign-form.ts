import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { useRouter } from "@/lib/navigation";
import { useFormAction } from "@/lib/use-form-action";
import { useZodMessages } from "@/lib/use-zod-messages";
import { assignAction } from "../actions";
import {
  type AssignFormOutput,
  type AssignFormValues,
  type AssignSubject,
  assignFormDefaults,
  assignFormSchema,
} from "./assign-form-schema";

export type UseAssignFormInput = {
  subject: AssignSubject;
  assigneeId: string | null;
  onDone: () => void;
};

/** Main assignee form; a refused removal (the status needs an assignee) shows on the field. */
export function useAssignForm({ subject, assigneeId, onDone }: UseAssignFormInput) {
  const t = useTranslations("assignment");
  const common = useTranslations("common");
  const router = useRouter();
  const form = useForm<AssignFormValues, unknown, AssignFormOutput>({
    resolver: zodResolver(assignFormSchema({ subject }), useZodMessages()),
    defaultValues: assignFormDefaults({ assigneeId }),
  });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => assignAction({ input: values }),
    messages: { pending: common("saving"), success: t("assigned") },
    onSuccess: () => {
      router.refresh();
      onDone();
    },
    onError: ({ error }) => {
      if (error.code === "CONFLICT") form.setError("assigneeId", { message: t("required") });
    },
  });
  return { form, submit, pending };
}
