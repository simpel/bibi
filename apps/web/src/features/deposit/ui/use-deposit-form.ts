import { zodResolver } from "@hookform/resolvers/zod";
import { DepositCreateInputSchema } from "@okazi/core/schemas";
import { useRouter } from "@okazi/i18n/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { blankToNull, minorOrNull } from "@/lib/blank";
import { formSchema } from "@/lib/form-schema";
import { ticketRoute } from "@/lib/routes";
import { useFormAction } from "@/lib/use-form-action";
import { useZodMessages } from "@/lib/use-zod-messages";
import { createDepositAction } from "../actions";

/** Raw values: the amount in kronor and the due date a `YYYY-MM-DD` day. */
export type DepositFormValues = { description: string; amount: string; dueDate: string };
export type DepositFormOutput = z.infer<typeof DepositCreateInputSchema>;

/** Core's `deposit.create` schema; the amount is typed in kronor and sent in öre. */
const depositFormSchema = ({ ticketId }: { ticketId: string }) =>
  formSchema({
    schema: DepositCreateInputSchema,
    toInput: ({ values }: { values: DepositFormValues }) => {
      const day = blankToNull({ value: values.dueDate });
      return {
        ticketId,
        description: values.description,
        amountMinor: minorOrNull({ value: values.amount }) ?? undefined,
        dueDate: day === null ? null : new Date(`${day}T23:59:59`),
      };
    },
  });

/** The deposit request form; on success it returns to the ticket. */
export function useDepositForm({ ticketId }: { ticketId: string }) {
  const t = useTranslations("deposit");
  const common = useTranslations("common");
  const router = useRouter();
  const form = useForm<DepositFormValues, unknown, DepositFormOutput>({
    resolver: zodResolver(depositFormSchema({ ticketId }), useZodMessages()),
    defaultValues: { description: "", amount: "", dueDate: "" },
  });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => createDepositAction({ input: values }),
    messages: { pending: common("saving"), success: t("created") },
    onSuccess: () => router.push(ticketRoute({ id: ticketId })),
  });
  return { form, submit, pending };
}
